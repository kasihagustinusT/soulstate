# Contributing to SoulState

First off, thank you for considering contributing to SoulState! It's people like you that make SoulState such a great tool.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker.
- Describe the bug and provide a minimal reproduction case.

### Suggesting Enhancements

- Open a GitHub issue to discuss the enhancement before starting work.

### Pull Requests

- Follow the existing code style.
- Ensure all tests pass (`npm test`).
- Add tests for new features or bug fixes.
- Update documentation as needed.

## Development Setup

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Run tests: `npm test`.
4. Run benchmarks: `npm run test:bench`.

## Design Principles

- **Minimal Allocations:** Avoid unnecessary object or array creations in hot paths.
- **Deterministic:** State updates must be predictable.
- **Explicit over Implicit:** Prefer explicit selectors over proxy-based magic.
- **Performance First:** Every change should be benchmarked.

Happy coding!
