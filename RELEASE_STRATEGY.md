# SoulState Release Strategy

This document outlines the release process for SoulState, ensuring a stable, predictable, and automated release cycle.

## Versioning

We use [Semantic Versioning 2.0.0](https://semver.org/). All release versions are managed automatically by `semantic-release` based on the commit messages.

- **Commit Message Convention:** We follow the [Conventional Commits specification](https://www.conventionalcommits.org/).
  - `fix:`: Corresponds to a `PATCH` release.
  - `feat:`: Corresponds to a `MINOR` release.
  - `BREAKING CHANGE:`: A commit with this in the footer corresponds to a `MAJOR` release.

## Release Channels

We use npm tags and GitHub releases to manage different channels.

- **`latest`**: The most recent stable release. This is what users get when they run `npm install soulstate`.
- **`next`**: The pre-release channel. This contains features that will be in the next stable release but are still under testing. Users can opt-in via `npm install soulstate@next`.
- **`rc`**: Release Candidate. Used for testing major versions before they are promoted to `latest`.

## Publishing Script

Publishing is handled automatically by the `release` job in our `ci.yml` workflow. The `npx semantic-release` command performs the following steps on the `main` branch:

1.  Analyzes commits since the last release.
2.  Determines the next version number.
3.  Generates release notes.
4.  Updates `package.json` with the new version.
5.  Creates a new Git tag.
6.  Publishes the package to the npm registry.
7.  Creates a GitHub Release with the generated notes.

## Final README for Publish

The final `README.md` should be concise, professional, and contain all essential information.

(A condensed version of the documentation's front page, with installation, basic usage, and a link to the full docs).
