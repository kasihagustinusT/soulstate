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
