# 1.0.0 (2025-11-17)


### Bug Fixes

* clean CI ([ecf6be1](https://github.com/kasihagustinusT/soulstate/commit/ecf6be1b1f210ad11f264d4a4af83b0518c59d92))
* clean CI 2 ([22a404c](https://github.com/kasihagustinusT/soulstate/commit/22a404ca48a9f0c20acaebfcf70e209ac3d89246))
* lint import grouping ([14cb4da](https://github.com/kasihagustinusT/soulstate/commit/14cb4da6aebf58de9f19f386b92ca259c710eff2))
* resolve merge conflict in persistMiddleware ([16ccb18](https://github.com/kasihagustinusT/soulstate/commit/16ccb18181a24feee37c6e29a02159f1731c6540))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-17

### Added
- Initial release of SoulState.
- High-performance core with automatic microtask batching.
- Doubly linked list subscription model for O(1) unsubscribe.
- Minimal structural sharing in `set` to prevent unnecessary object allocations.
- Development-only mutation guard with `Object.freeze`.
- React bindings with `useStore` and `useStoreShallow` hooks.
