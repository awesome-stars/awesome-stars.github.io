const { Octokit } = require("@octokit/rest");
const { throttling } = require("@octokit/plugin-throttling");

const DEFAULT_MARKDOWN_PATH = "README.md";
const GRAPHQL_BATCH_SIZE = 50;

let CURRENT_REPO = null;
let CURRENT_PATH = DEFAULT_MARKDOWN_PATH;
let CURRENT_REF = null;
let RATE_LIMIT_EXCEEDED;
let TOTAL_API_CALLS_COUNTER;
let ONGOING_REQUESTS_COUNTER = 0;
let TOTAL_REPO_LINKS = 0;
let TOTAL_BADGES_LOADED = 0;
let TOTAL_BADGES_FAILED = 0;
let REPO_LINKS = new Map();


function clear_old_data() {
  clearHeader();
  clearMsg();
  clearContent();
  removeProgressBar();
  setApiCallsLabel(0);
  hideStatsBar();
  CURRENT_REPO = null;
  CURRENT_PATH = DEFAULT_MARKDOWN_PATH;
  CURRENT_REF = null;
  RATE_LIMIT_EXCEEDED = false;
  TOTAL_API_CALLS_COUNTER = 0;
  ONGOING_REQUESTS_COUNTER = 0;
  TOTAL_REPO_LINKS = 0;
  TOTAL_BADGES_LOADED = 0;
  TOTAL_BADGES_FAILED = 0;
  REPO_LINKS = new Map();
  shouldTriggerQueryOnTokenSave = false;
}

function getOnlyDate(full) {
  return full ? full.split('T')[0] : "unknown";
}

function normalizePath(path) {
  const cleanPath = (path || DEFAULT_MARKDOWN_PATH).trim().replace(/^\/+/, "");
  return cleanPath || DEFAULT_MARKDOWN_PATH;
}

function getRefOrNull(ref) {
  const cleanRef = (ref || "").trim();
  return cleanRef || null;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(num >= 10000000 ? 0 : 1)}m`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`;
  }
  return `${num}`;
}

function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, object, embed, form, input, button").forEach(el => el.remove());
  doc.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
      if ((name === "href" || name === "src") && /^javascript:/i.test(value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function onRateLimitExceeded() {
  if (!RATE_LIMIT_EXCEEDED) {
    console.warn('[awesome-stars] GitHub API rate-limit exceeded.');
    RATE_LIMIT_EXCEEDED = true;
    setMsg(AS_MSG_API_RATE);
    disableQueryFields();
    if (!LOCAL_STORAGE_GITHUB_ACCESS_TOKEN) {
      proposeAddingToken();
    }
  }
}

function incrementCounters() {
  ONGOING_REQUESTS_COUNTER++;
  TOTAL_API_CALLS_COUNTER++;
  setApiCallsLabel(TOTAL_API_CALLS_COUNTER);
}

function decrementCounters() {
  ONGOING_REQUESTS_COUNTER--;
  if (ONGOING_REQUESTS_COUNTER <= 0 && !RATE_LIMIT_EXCEEDED) {
    enableQueryFields();
  }
}

function searchNotAllowed() {
  if (shouldTriggerQueryOnTokenSave) {
    return false;
  }
  return ONGOING_REQUESTS_COUNTER !== 0 || JQ_SEARCH_BTN.hasClass('is-loading');
}

function send(requestPromise, successFn, failureFn) {
  if (RATE_LIMIT_EXCEEDED) {
    failureFn();
    return;
  }

  incrementCounters();
  requestPromise()
  .then(response => successFn(response.headers, response.data))
  .catch(error => {
    if (error && (error.status === 403 || error.status === 429)) {
      onRateLimitExceeded();
    }
    failureFn(error);
  })
  .finally(() => decrementCounters());
}

function renderRepoLink(fullName) {
  return `<a href="${buildGithubRepoURL(fullName)}" target="_blank" rel="noopener noreferrer">${fullName}</a>`;
}

function updateHeader() {
  const refText = CURRENT_REF ? ` @ ${CURRENT_REF}` : "";
  setHeader(`<b>Rendered markdown</b>: ${renderRepoLink(CURRENT_REPO)} / <span class="is-family-monospace">${CURRENT_PATH}</span>${refText}`);
}

function updateStatsBar() {
  setStatsBar(`${TOTAL_REPO_LINKS} GitHub repo links found · ${TOTAL_BADGES_LOADED} loaded · ${TOTAL_BADGES_FAILED} unavailable`);
}

function parseGithubRepoHref(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }

  if (url.hostname.toLowerCase() !== "github.com") {
    return null;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) {
    return null;
  }

  const [owner, repoPart] = parts;
  const repo = repoPart.replace(/\.git$/i, "");
  const validPart = /^[A-Za-z0-9_.-]+$/;
  if (!validPart.test(owner) || !validPart.test(repo)) {
    return null;
  }

  return {
    owner,
    repo,
    key: `${owner}/${repo}`.toLowerCase(),
    fullName: `${owner}/${repo}`
  };
}

function collectRepoLinks() {
  REPO_LINKS = new Map();

  JQ_CONTENT.find("a[href]").each(function() {
    if ($(this).find("img").length > 0) {
      return;
    }

    const parsed = parseGithubRepoHref(this.href);
    if (!parsed) {
      return;
    }

    if (!REPO_LINKS.has(parsed.key)) {
      REPO_LINKS.set(parsed.key, {
        owner: parsed.owner,
        repo: parsed.repo,
        fullName: parsed.fullName,
        anchors: []
      });
    }
    REPO_LINKS.get(parsed.key).anchors.push(this);
  });

  TOTAL_REPO_LINKS = REPO_LINKS.size;
  TOTAL_BADGES_LOADED = 0;
  TOTAL_BADGES_FAILED = 0;
  updateStatsBar();
}

function createBadgeElement(state, stats) {
  const badge = document.createElement("span");
  badge.className = `as-badge as-badge-${state}`;

  if (state === "loaded") {
    badge.title = `${stats.nameWithOwner}: ${stats.stargazerCount} stars, ${stats.forkCount} forks, last push ${getOnlyDate(stats.pushedAt)}`;
    badge.innerHTML = `
      <span class="as-badge-segment as-stars">${SVG_STAR} ${formatNumber(stats.stargazerCount)}</span>
      <span class="as-badge-segment as-forks">${SVG_FORK} ${formatNumber(stats.forkCount)}</span>
      <span class="as-badge-segment as-date">${SVG_DATE} ${getOnlyDate(stats.pushedAt)}</span>`;
  } else if (state === "token") {
    badge.title = "Save a GitHub token to load repository metadata";
    badge.textContent = "stats need token";
  } else if (state === "loading") {
    badge.title = "Loading repository metadata";
    badge.textContent = "loading stats";
  } else {
    badge.title = "Repository metadata is unavailable";
    badge.textContent = "stats unavailable";
  }

  return badge;
}

function setBadgesForRepo(repoInfo, state, stats) {
  for (const anchor of repoInfo.anchors) {
    const next = anchor.nextElementSibling;
    if (next && next.classList.contains("as-badge")) {
      next.replaceWith(createBadgeElement(state, stats));
    } else {
      anchor.insertAdjacentElement("afterend", createBadgeElement(state, stats));
    }
  }
}

function setAllBadges(state) {
  for (const repoInfo of REPO_LINKS.values()) {
    setBadgesForRepo(repoInfo, state);
  }
}

function markRepoLoaded(repoInfo, stats) {
  TOTAL_BADGES_LOADED++;
  setBadgesForRepo(repoInfo, "loaded", stats);
  updateStatsBar();
}

function markRepoFailed(repoInfo) {
  TOTAL_BADGES_FAILED++;
  setBadgesForRepo(repoInfo, "unavailable");
  updateStatsBar();
}

function buildMetadataQuery(repos) {
  const variables = {};
  const declarations = [];
  const selections = [];

  repos.forEach((repoInfo, index) => {
    const ownerVar = `owner${index}`;
    const nameVar = `name${index}`;
    variables[ownerVar] = repoInfo.owner;
    variables[nameVar] = repoInfo.repo;
    declarations.push(`$${ownerVar}: String!`, `$${nameVar}: String!`);
    selections.push(`
      r${index}: repository(owner: $${ownerVar}, name: $${nameVar}) {
        nameWithOwner
        url
        stargazerCount
        forkCount
        pushedAt
      }`);
  });

  const query = `
    query AwesomeStarsMetadata(${declarations.join(", ")}) {
      ${selections.join("\n")}
      rateLimit {
        remaining
        resetAt
      }
    }`;

  return { query, variables };
}

function fetchMetadataBatch(repos) {
  const { query, variables } = buildMetadataQuery(repos);
  send(
    () => octokit.graphql(query, variables)
      .catch(error => {
        if (error.data) {
          return error.data;
        }
        throw error;
      })
      .then(data => ({ headers: {}, data })),
    (headers, data) => {
      repos.forEach((repoInfo, index) => {
        const stats = data[`r${index}`];
        if (stats) {
          markRepoLoaded(repoInfo, stats);
        } else {
          markRepoFailed(repoInfo);
        }
      });
    },
    () => repos.forEach(markRepoFailed)
  );
}

function enrichRepoLinks() {
  if (TOTAL_REPO_LINKS === 0) {
    setMsg(AS_MSG_NO_REPO_LINKS);
    enableQueryFields();
    return;
  }

  if (!LOCAL_STORAGE_GITHUB_ACCESS_TOKEN) {
    setAllBadges("token");
    setMsg(AS_MSG_TOKEN_REQUIRED);
    enableQueryFields();
    proposeAddingToken();
    return;
  }

  setAllBadges("loading");
  const repos = [...REPO_LINKS.values()];
  for (let i = 0; i < repos.length; i += GRAPHQL_BATCH_SIZE) {
    fetchMetadataBatch(repos.slice(i, i + GRAPHQL_BATCH_SIZE));
  }
}

function decodeContent(responseData) {
  if (Array.isArray(responseData)) {
    throw new Error("The selected path is a directory, not a markdown file.");
  }
  if (!responseData.content) {
    throw new Error("GitHub did not return file content for this path.");
  }

  const binary = atob(responseData.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function renderMarkdown(rawMarkdown) {
  send(
    () => octokit.request("POST /markdown", {
      text: rawMarkdown,
      mode: "gfm",
      context: CURRENT_REPO
    }),
    (headers, html) => {
      setContent(sanitizeHtml(html));
      collectRepoLinks();
      clearNonErrorMsg();
      enrichRepoLinks();
    },
    () => {
      setContent(`<pre class="as-raw-markdown"></pre>`);
      JQ_CONTENT.find("pre").text(rawMarkdown);
      setMsg(AS_MSG_MARKDOWN_RENDER_ERROR);
      enableQueryFields();
    }
  );
}

function fetchMarkdownFile(owner, repo, path, ref) {
  const options = { owner, repo, path };
  if (ref) {
    options.ref = ref;
  }

  send(
    () => octokit.repos.getContent(options),
    (headers, responseData) => {
      try {
        const rawMarkdown = decodeContent(responseData);
        renderMarkdown(rawMarkdown);
      } catch (error) {
        setMsg(error.message);
        enableQueryFields();
      }
    },
    () => {
      setMsg(AS_MSG_LOAD_ERROR);
      enableQueryFields();
    }
  );
}

function initial_request(owner, repo) {
  send(
    () => octokit.repos.get({ owner, repo }),
    (headers, responseData) => {
      if (!CURRENT_REF) {
        CURRENT_REF = responseData.default_branch;
      }
      updateHeader();
      fetchMarkdownFile(owner, repo, CURRENT_PATH, CURRENT_REF);
    },
    () => {
      setMsg(AS_MSG_LOAD_ERROR);
      enableQueryFields();
    }
  );
}

function parse_query(queryString) {
  const shorthand = /^(?<user>[\w.-]+)\/(?<repo>[\w.-]+)$/;
  const shorthandMatch = shorthand.exec((queryString || "").trim());

  if (shorthandMatch) {
    const {user, repo} = shorthandMatch.groups;
    return {user, repo};
  }

  let pathname;
  try {
    pathname = new URL(queryString).pathname;
  } catch {
    return null;
  }

  const values = pathname.split('/').filter(s => s.length > 0);
  if (values.length < 2) {
    return null;
  }

  const [user, repo] = values;
  return {user, repo: repo.replace(/\.git$/i, "")};
}

function initiate_search() {
  if (searchNotAllowed()) {
    return;
  }

  clear_old_data();

  const queryString = getQueryOrDefault("sindresorhus/awesome");
  const queryValues = parse_query(queryString);

  if (!queryValues) {
    setMsg('Please enter a valid query: it should contain two strings separated by a "/", or the full URL to a GitHub repo.');
    ga_faultyQuery(queryString);
    return;
  }

  const {user, repo} = queryValues;
  CURRENT_REPO = `${user}/${repo}`;
  CURRENT_PATH = normalizePath(getPathOrDefault(DEFAULT_MARKDOWN_PATH));
  CURRENT_REF = getRefOrNull(getRefFromUrl());

  setUpOctokitWithLatestToken();
  setQuery(CURRENT_REPO);
  setPath(CURRENT_PATH);
  setQueryFieldsAsLoading();
  setMsg(AS_MSG_LOADING_MARKDOWN);
  showStatsBar();
  updateStatsBar();

  if (history.replaceState) {
    const params = new URLSearchParams();
    params.set("repo", CURRENT_REPO);
    if (CURRENT_PATH !== DEFAULT_MARKDOWN_PATH) {
      params.set("path", CURRENT_PATH);
    }
    if (CURRENT_REF) {
      params.set("ref", CURRENT_REF);
    }
    history.replaceState({}, document.title, `?${params.toString()}`);
  }

  ga_searchQuery(user, repo);
  initial_request(user, repo);
}


const MyOctokit = Octokit.plugin(throttling);
let octokit;
setUpOctokitWithLatestToken();
function setUpOctokitWithLatestToken() {
  if (!shouldReconstructOctokit) {
    return;
  }

  octokit = new MyOctokit({
    auth: LOCAL_STORAGE_GITHUB_ACCESS_TOKEN,
    userAgent: 'awesome-stars',
    throttle: {
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        onRateLimitExceeded();
        if (retryCount < 1) {
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        setMsg(AS_MSG_SLOWER);

        if (!getJq_ProgressBar()[0]) {
          JQ_ID_MSG.after(`<progress class="progress is-small" value="${retryAfter}" max="${retryAfter}">some%</progress>`);
          getJq_ProgressBar().animate(
            {value: "0"},
            {
              duration: 1000 * retryAfter,
              easing: 'linear',
              done: function() {
                getJq_ProgressBar().removeAttr('value');
              }
            }
          );
        }

        return true;
      }
    }
  });

  shouldReconstructOctokit = false;
}


JQ_SEARCH_BTN.click(event => {
  event.preventDefault();
  initiate_search();
});
JQ_REPO_FIELD.keyup(event => {
  if (event.keyCode === 13) {
    initiate_search();
  }
});
JQ_PATH_FIELD.keyup(event => {
  if (event.keyCode === 13) {
    initiate_search();
  }
});

if (JQ_REPO_FIELD.val()) {
  JQ_SEARCH_BTN.click();
}
