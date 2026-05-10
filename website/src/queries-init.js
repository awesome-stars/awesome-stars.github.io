const SELF_URL = new URL(".", window.location.href).toString();

const JQ_REPO_FIELD  = $('#repo');
const JQ_PATH_FIELD  = $('#path');
const JQ_SEARCH_BTN  = $('#searchBtn');
const JQ_TOTAL_CALLS = $('#totalApiCalls');

const AS_MSG_LOADING_MARKDOWN = "Loading markdown from GitHub.";
const AS_MSG_NO_REPO_LINKS = "No root GitHub repository links were found in this markdown file.";
const AS_MSG_TOKEN_REQUIRED = "Markdown loaded. Save a GitHub token to load stars, forks, and last push dates.";
const AS_MSG_LOAD_ERROR = "There seems to have been an error loading that repository or markdown file. Check the repository, path, ref, or access token.";
const AS_MSG_MARKDOWN_RENDER_ERROR = "GitHub markdown rendering failed, so the raw markdown is shown instead.";
const AS_MSG_SLOWER = "The scan will stall for a little while due to the high amount of requests.";
const AS_MSG_API_RATE = "<b>GitHub API rate-limits exceeded.</b> Consider providing an <b>Access Token</b> if you haven't already.";

const AS_PRESERVED_MSGS = [
  AS_MSG_LOAD_ERROR,
  AS_MSG_MARKDOWN_RENDER_ERROR,
  AS_MSG_API_RATE,
  AS_MSG_TOKEN_REQUIRED
];

const EXAMPLE_LINK_1 = `<a href="${buildAutoQueryURL('sindresorhus/awesome')}"
                           onclick="ga_shortExampleLink();">sindresorhus/awesome</a>`;
const EXAMPLE_LINK_2 = `<a href="${buildAutoQueryURL('sindresorhus/awesome-nodejs', 'readme.md')}"
                           onclick="ga_fullExampleLink();">sindresorhus/awesome-nodejs</a>`;
const BODY_REPO_LINK = `<a href="${buildGithubRepoURL('useful-forks/useful-forks.github.io')}"
                           onclick="ga_bodyRepoLink();">the GitHub project</a>`;
const LANDING_PAGE_INIT_MSG = "<h1 class='title'>Awesome Stars</h1>"
    + "<p class='subtitle'>Render an awesome list and annotate GitHub repository links with stars, forks, and recent activity.</p>"
    + "Type a repository above, or try <strong>" + EXAMPLE_LINK_1 + "</strong> or <strong>" + EXAMPLE_LINK_2 + "</strong>.<br/><br/>"
    + "Use a URL like <span class='is-family-monospace'>?repo=owner/name&path=README.md</span> to deep-link directly from an awesome list badge.<br/><br/>"
    + "For more information, check out " + BODY_REPO_LINK + ".";

const SVG_FORK = '<svg class="octicon octicon-repo-forked v-align-text-bottom" viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" role="img"><title>Amount of forks, or name of the repository</title><path fill-rule="evenodd" d="M8 1a1.993 1.993 0 00-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 002 1a1.993 1.993 0 00-1 3.72V6.5l3 3v1.78A1.993 1.993 0 005 15a1.993 1.993 0 001-3.72V9.5l3-3V4.72A1.993 1.993 0 008 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"></path></svg>';
const SVG_STAR = '<svg class="octicon octicon-star v-align-text-bottom" viewBox="0 0 14 16" width="14" height="16" aria-label="star" role="img"><title>Amount of stars</title><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"></path></svg>';
const SVG_DATE = '<svg class="octicon octicon-history text-gray" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" role="img"><title>Date of the most recent push in any branch of the repository</title><path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"></path></svg>';

function buildAutoQueryURL(repo, path) {
  const params = new URLSearchParams();
  params.set("repo", repo);
  if (path) {
    params.set("path", path);
  }
  return `${SELF_URL}?${params.toString()}`;
}
function buildGithubRepoURL(repo) {
  return `https://github.com/${repo}`;
}

function getJq_ProgressBar() {
  return $(".progress");
}
function removeProgressBar() {
  getJq_ProgressBar().remove();
}

function setMsg(msg) {
  JQ_ID_MSG
    .html(msg)
    .addClass("box")
    .addClass("has-background-info-light")
    .css("border-width", "thin")
    .css("border-color", "rgba(0,0,0,0.25)")
    .css("border-style", "solid");
}
function clearMsg() {
  JQ_ID_MSG
    .empty()
    .removeClass("box")
    .css("border-style", "");
}
function clearNonErrorMsg() {
  const msg = JQ_ID_MSG.html();
  if (!AS_PRESERVED_MSGS.includes(msg)) {
    clearMsg();
  }
}
function setHeader(msg) {
  JQ_ID_HEADER.html(msg);
}
function clearHeader() {
  JQ_ID_HEADER.empty();
}
function setContent(html) {
  JQ_CONTENT.html(html);
}
function clearContent() {
  JQ_CONTENT.empty();
}
function setStatsBar(msg) {
  JQ_STATS_BAR.html(msg);
}
function showStatsBar() {
  JQ_STATS_BAR.show();
}
function hideStatsBar() {
  JQ_STATS_BAR.hide().empty();
}

function enableQueryFields() {
  JQ_REPO_FIELD.prop('disabled', false);
  JQ_PATH_FIELD.prop('disabled', false);
  JQ_SEARCH_BTN.prop('disabled', false);
  JQ_SEARCH_BTN.removeClass('is-loading');
}
function setQueryFieldsAsLoading() {
  JQ_REPO_FIELD.prop('disabled', true);
  JQ_PATH_FIELD.prop('disabled', true);
  JQ_SEARCH_BTN.addClass('is-loading');
}
function disableQueryFields() {
  JQ_REPO_FIELD.prop('disabled', true);
  JQ_PATH_FIELD.prop('disabled', true);
  JQ_SEARCH_BTN.prop('disabled', true);
  JQ_SEARCH_BTN.removeClass('is-loading');
}

function setQuery(query) {
  JQ_REPO_FIELD.val(query);
}
function setPath(path) {
  JQ_PATH_FIELD.val(path);
}
function getQueryOrDefault(defaultVal) {
  if (!JQ_REPO_FIELD.val()) {
    setQuery(defaultVal);
  }
  return JQ_REPO_FIELD.val();
}
function getPathOrDefault(defaultVal) {
  if (!JQ_PATH_FIELD.val()) {
    setPath(defaultVal);
  }
  return JQ_PATH_FIELD.val();
}
function setApiCallsLabel(total) {
  JQ_TOTAL_CALLS.html(total + " calls");
}

function getRepoNameFromUrl() {
  let repo = new URLSearchParams(location.search).get('repo');
  if (!repo) {
    repo = new URLSearchParams(location.search).get('repository');
  }
  return repo;
}
function getPathFromUrl() {
  return new URLSearchParams(location.search).get('path')
      || new URLSearchParams(location.search).get('file');
}
function getRefFromUrl() {
  return new URLSearchParams(location.search).get('ref');
}

function landingPageTrigger() {
  const query = getRepoNameFromUrl();
  const path = getPathFromUrl();
  if (query) {
    setQuery(query);
    if (path) {
      setPath(path);
    }
    return "";
  }
  setPath("README.md");
  return LANDING_PAGE_INIT_MSG;
}

function searchNotAllowed() {
  if (shouldTriggerQueryOnTokenSave) {
    return false;
  }
  return ONGOING_REQUESTS_COUNTER !== 0 || JQ_SEARCH_BTN.hasClass('is-loading');
}

const AS_ID_WRAPPER = 'awesome_stars_wrapper';
const AS_ID_HEADER  = 'awesome_stars_header';
const AS_ID_MSG     = 'awesome_stars_msg';
const AS_ID_STATS   = 'awesome_stars_stats';
const AS_ID_CONTENT = 'awesome_stars_content';

$('#awesome_stars_inject').append(
    $('<div>', {id: AS_ID_WRAPPER}).append(
        $('<div>', {id: AS_ID_HEADER}),
        $('<div>', {id: AS_ID_MSG}).html(landingPageTrigger()),
        $('<div>', {id: AS_ID_STATS, class: "as-stats-bar"}).hide(),
        $('<article>', {id: AS_ID_CONTENT, class: "markdown-body"})
    )
);
function getJqId_$(id) {
  return $('#' + id);
}
const JQ_ID_HEADER = getJqId_$(AS_ID_HEADER);
const JQ_ID_MSG = getJqId_$(AS_ID_MSG);
const JQ_STATS_BAR = getJqId_$(AS_ID_STATS);
const JQ_CONTENT = getJqId_$(AS_ID_CONTENT);
