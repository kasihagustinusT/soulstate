import Link from 'next/link';
import { Callout } from '../components/callout';

# Welcome to SoulState

**The Zero-Overhead State of Mind.**

SoulState is a minimalist, high-performance state management library for modern web applications. It's designed from the ground up to be:

- **Fast**: Automatic batching, selector-based subscriptions, and O(1) subscriber management ensure your app stays fast, no matter the scale.
- **Scalable**: Built for complex applications, with first-class support for middleware and async operations.
- **Developer-Friendly**: A simple, intuitive API that gets out of your way and lets you focus on building.
- **Tiny**: A minimal footprint to keep your bundles small.

<Callout type="info" title="Core Philosophy">
  SoulState believes that components should only re-render when the exact data they need changes. By using selectors for data access, you get surgical precision in your updates, leading to optimal performance by default.
</Callout>

## Quick Start

Ready to dive in? Create your first store in under a minute.

```bash
npm install soulstate
```

Then, see the [Installation](/getting-started) guide to get started.

## Key Features

- **Selector-driven `useStore` hook**: Subscribe to the exact state you need.
- **Automatic batching with microtasks**: Multiple updates, one render.
- **Middleware support**: Extend the store with logging, persistence, and more.
- **`useSyncExternalStore`**: Full React 18+ concurrent features compatibility.
- **Minimal API**: `createStore`, `get`, `set`, `subscribe`. That's it.

<div className="mt-8 flex gap-4">
  <Link href="/getting-started" className="no-underline px-4 py-2 font-bold text-white bg-dark-primary rounded-md hover:bg-dark-primary-hover">
    Get Started
  </Link>
  <a href="https://github.com/your-repo/soulstate" target="_blank" rel="noopener noreferrer" className="no-underline px-4 py-2 font-bold text-white bg-dark-card rounded-md hover:bg-dark-border">
    View on GitHub
  </a>
</div>
