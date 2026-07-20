# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5](https://github.com/kasihagustinusT/soulstate/compare/v1.0.4...v1.0.5) (2026-07-20)

### Documentation

* Synchronize all documentation with implementation
* Update API reference for `core-store`, `utilities`, `react`, `set-state`, `subscribe`
* Correct all import paths and type signatures
* Replace unsupported performance claims ("Zero Overhead", "Zero-Allocation Tracking", "blazing")
* Add missing API documentation: `getVersion()`, `destroy()`, `Computed<T>`, `Derived<T>`, `onRender` callback
* Correct homepage examples: `.setState()` replaces `.set()`, `store.computed()` replaces getter-based derived
* Fix benchmark numbers: 100K subscribers (was 10K)
* Update project description and keywords in `package.json`
* Update copyright year to 2026
* Add comprehensive examples for all guide pages

### API

* Verify all 28 public exports against source implementation
* Expand `core-store.mdx` API reference with all store methods
* Document `scheduleTask`, `flushSync`, `createSelector`, `selector`, `derived` in `utilities.mdx`
* Add `PersistOptions<T>` and `DevToolsOptions<T>` type documentation
* Fix `useShallow` import path (from `soulstate/react`, not `soulstate`)

### Engineering

* Repository consistency audit: source, types, exports, docs, README, homepage, package metadata all verified
* Remove outdated terminology from all documentation and root `.md` files
* Bitmask threshold corrected from ≤8 to ≤64 in documentation
* `onRender` callback signature corrected to `(count: number) => void`
* `getMetrics` return type documented as `MetricsSnapshot | null` (nullable when instrumentation not enabled)
* `shallow` correctly documented as exported from `soulstate/utils` (not main entry)

### Quality

* 188 tests pass across 30 test files
* TypeScript compilation: zero errors
* Build output verified: 4 entry points with JS, CJS, DTS, sourcemaps
* npm pack contents verified
* All 30 sidebar entries map to existing `.mdx` files
* All 16 internal cross-references valid

## [1.0.4](https://github.com/kasihagustinusT/soulstate/compare/v1.0.3...v1.0.4) (2026-07-19)

### Changed

* Separate React entry from core runtime
* Refactor internal module structure

## [1.0.3](https://github.com/kasihagustinusT/soulstate/compare/v1.0.2...v1.0.3) (2026-07-19)

### Changed

* Internal improvements and bug fixes

## [1.0.2](https://github.com/kasihagustinusT/soulstate/compare/v1.0.1...v1.0.2) (2026-07-19)

### Changed

* Internal improvements and bug fixes

## [1.0.1](https://github.com/kasihagustinusT/soulstate/compare/v1.0.0...v1.0.1) (2025-11-18)

### Bug Fixes

* **docs:** configure mdx and update dependencies

## [1.0.0] - 2025-11-17

### Added

- Initial release of SoulState.
- High-performance core with automatic microtask batching.
- Doubly linked list subscription model for O(1) unsubscribe.
- Minimal structural sharing in `setState` to prevent unnecessary object allocations.
- Development-only mutation guard with `Object.freeze`.
- React bindings with `useStore` and `useShallow` hooks.
