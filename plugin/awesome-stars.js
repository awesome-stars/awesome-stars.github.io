function getRepoUrl() {
  const pathComponents = window.location.pathname.split("/");
  const user = pathComponents[1];
  const repo = pathComponents[2];
  return `https://awesome-stars.github.io/?repo=${user}/${repo}`;
}

function setBtnUrl() {
  const button = document.getElementById(AS_BTN_ID);
  button.addEventListener("click", () => {
    window.open(getRepoUrl(), "_blank", "noopener,noreferrer");
  });
}

function createAwesomeStarsBtn() {
  const li = document.createElement("li");
  const content = `
  <div class="float-left">
    <button id="${AS_BTN_ID}" class="btn-sm btn" aria-describedby="${AS_TIP_ID}">
      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-star">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
      </svg>
      Stars
    </button>
    <tool-tip for="${AS_BTN_ID}" id="${AS_TIP_ID}" popover="manual" class="position-absolute sr-only">
      Open this repository in Awesome Stars
    </tool-tip>
  </div>
  `;
  li.innerHTML = content;
  li.id = AS_LI_ID;
  return li;
}

function getRepoActionListItem() {
  const forkBtn = document.getElementById("repo-network-counter");
  if (forkBtn) {
    return forkBtn.closest("li");
  }

  const starBtn = document.getElementById("repo-stars-counter-star");
  if (starBtn) {
    return starBtn.closest("li");
  }

  return null;
}

function isRepositoryPage() {
  const pathComponents = window.location.pathname.split("/").filter(Boolean);
  if (pathComponents.length < 2) {
    return false;
  }

  const nonRepoSections = new Set([
    "actions",
    "codespaces",
    "collections",
    "dashboard",
    "explore",
    "features",
    "marketplace",
    "notifications",
    "organizations",
    "pulls",
    "search",
    "settings",
    "sponsors",
    "topics"
  ]);
  return !nonRepoSections.has(pathComponents[0]);
}

function init() {
  const oldLi = document.getElementById(AS_LI_ID);
  if (oldLi) {
    oldLi.remove();
  }

  if (!isRepositoryPage()) {
    return;
  }

  const parentLi = getRepoActionListItem();
  if (!parentLi || !parentLi.parentNode) {
    return;
  }

  const newLi = createAwesomeStarsBtn();
  parentLi.parentNode.insertBefore(newLi, parentLi);
  setBtnUrl();
}

const AS_LI_ID = "awesome_stars_li";
const AS_BTN_ID = "awesome_stars_btn";
const AS_TIP_ID = "awesome_stars_tooltip";
init();

let timeout;
const observer = new MutationObserver(() => {
  clearTimeout(timeout);
  timeout = setTimeout(init, 10);
});
observer.observe(document.body, { childList: true, subtree: false });
