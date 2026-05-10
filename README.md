# Awesome Stars

![Awesome Stars banner](website/assets/awesome-stars-banner.svg)

Awesome Stars renders a GitHub markdown file, finds GitHub repository links in it, and adds live repository stats beside each link.

It is designed for awesome lists, where the README often contains many project links but does not make popularity or maintenance activity easy to scan.

## Online Usage

Open the website and provide a repository in `owner/name` format. If deployed from a fork on GitHub Pages, the root page redirects into the static app under `website/` and preserves query strings.

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

## Metadata

For each root GitHub repository link, Awesome Stars shows:

- Stars
- Forks
- Last push date

Links such as issues, pull requests, `blob` files, `tree` folders, releases, org pages, user pages, images, and non-GitHub links are not annotated.

Metadata enrichment uses GitHub GraphQL batching. GitHub requires authentication for GraphQL, so readers need to save a GitHub access token in the browser before stats can load. The token is stored only in localStorage and is sent only to GitHub APIs.

## Development

The website lives in [`website`](/website).

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

## Browser Extension

The [`plugin`](/plugin) directory contains a Chrome-compatible extension based on the original Useful Forks extension structure. It injects a **Stars** button on GitHub repository pages and opens the current repository in Awesome Stars.

## Acknowledgment

Awesome Stars is adapted from [Useful Forks](https://github.com/useful-forks/useful-forks.github.io). It keeps the same static GitHub Pages approach, local browser token storage, and Octokit-based GitHub API access pattern, while replacing the fork-discovery workflow with markdown rendering and repository-stat enrichment. The Awesome Stars repository is [awesome-stars/awesome-stars.github.io](https://github.com/awesome-stars/awesome-stars.github.io).
