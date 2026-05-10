# Awesome Stars

[![Website](https://img.shields.io/badge/open-awesome--stars-f2cc60?style=flat&labelColor=24292f)](https://awesome-stars.github.io/)
[![GitHub Pages](https://img.shields.io/github/actions/workflow/status/awesome-stars/awesome-stars.github.io/website.yml?branch=master&label=pages)](https://github.com/awesome-stars/awesome-stars.github.io/actions/workflows/website.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/awesome-stars/awesome-stars.github.io?style=social)](https://github.com/awesome-stars/awesome-stars.github.io)

![Awesome Stars banner](website/assets/awesome-stars-banner.svg)

Awesome Stars renders a GitHub markdown file, finds GitHub repository links in it, and adds live repository stats beside each link.

The itch is simple: an awesome list can be genuinely useful and still hard to scan. You open a README with two hundred links, every project has a good name, and suddenly you are opening tabs just to find out which libraries are alive, popular, or abandoned. Awesome Stars keeps the list intact, but adds the missing context: stars, forks, and last push date.

## About

Awesome Stars is a small companion for GitHub awesome lists. Give it a repo, and it renders the list with live popularity and maintenance signals next to each GitHub project link, so readers can browse with context instead of tab-hunting.

## Use It

Open [awesome-stars.github.io](https://awesome-stars.github.io/) and enter a repository in `owner/name` format.

Deep links are supported:

```text
https://awesome-stars.github.io/?repo=sindresorhus/awesome
https://awesome-stars.github.io/?repo=sindresorhus/awesome-nodejs&path=readme.md
https://awesome-stars.github.io/?repo=owner/name&path=docs/list.md&ref=main
```

Query parameters:

| Param | Description |
| --- | --- |
| `repo` | GitHub repository containing the markdown file. |
| `path` | Markdown file path. Defaults to `README.md`. |
| `ref` | Optional branch, tag, or commit SHA. Defaults to the repository default branch. |

## Add a Badge

If you maintain an awesome list, add a small Shields badge near the top of your README so readers can jump to the enriched view.

Basic badge:

```md
[![Awesome Stars](https://img.shields.io/badge/Awesome%20Stars-view%20stats-f2cc60?labelColor=24292f)](https://awesome-stars.github.io/?repo=OWNER/REPO)
```

Badge for a non-default markdown file:

```md
[![Awesome Stars](https://img.shields.io/badge/Awesome%20Stars-view%20stats-f2cc60?labelColor=24292f)](https://awesome-stars.github.io/?repo=OWNER/REPO&path=docs/list.md)
```

Example:

```md
[![Awesome Stars](https://img.shields.io/badge/Awesome%20Stars-view%20stats-f2cc60?labelColor=24292f)](https://awesome-stars.github.io/?repo=sindresorhus/awesome)
```

## What Gets Annotated

For each root GitHub repository link, Awesome Stars shows:

- Stars
- Forks
- Last push date

Links such as issues, pull requests, `blob` files, `tree` folders, releases, org pages, user pages, images, and non-GitHub links are not annotated.

Metadata enrichment uses GitHub GraphQL batching. GitHub requires authentication for GraphQL, so readers need to save a GitHub access token in the browser before stats can load. The token is stored only in localStorage and is sent only to GitHub APIs.

## Browser Extension

The [`plugin`](/plugin) directory contains a Chrome-compatible extension based on the original Useful Forks extension structure. It injects a **Stars** button on GitHub repository pages and opens the current repository in Awesome Stars.

## Development

The website lives in [`website`](/website). GitHub Pages deploys that directory as the site root through `.github/workflows/website.yml`.

```sh
cd website
npm install
npm run build
```

For local development:

```sh
cd website
npm run dev
```

## Acknowledgment

Awesome Stars is adapted from [Useful Forks](https://github.com/useful-forks/useful-forks.github.io). It keeps the same static GitHub Pages approach, local browser token storage, extension foundation, and Octokit-based GitHub API access pattern, while replacing the fork-discovery workflow with markdown rendering and repository-stat enrichment.
