<p align="center">
  <img
    src="https://github.com/user-attachments/assets/b6df7f4f-10a8-4ec4-9165-e99033f2ee41"
    alt="SoulState"
    width="500"
  />
</p>

<h1 align="center">SoulState</h1>

<p align="center">

<img src="https://img.shields.io/badge/100K%2B%20Subscribers-Benchmarked-success?style=for-the-badge" />

<img src="https://img.shields.io/badge/Surgical%20Propagation-Enabled-blue?style=for-the-badge" />

<img src="https://img.shields.io/badge/Zero--Op%20Updates-Optimized-purple?style=for-the-badge" />

<img src="https://img.shields.io/badge/Deterministic-Batching-orange?style=for-the-badge" />

</p>

SoulState is a high-performance state management engine specialized for sparse updates, deep dependency propagation, and enterprise-scale subscription graphs. It is designed to handle **100,000+ active subscribers** with predictable latency and surgical precision.

Unlike minimalist libraries that focus on raw throughput for simple use cases, SoulState is engineered as a **reactive graph runtime** that handles complex dependency chains and eliminates irrelevant updates at scale.

[![CI](https://github.com/kasihagustinusT/soulstate/actions/workflows/ci.yml/badge.svg)](https://github.com/kasihagustinusT/soulstate/actions/workflows/ci.yml)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/soulstate)](https://bundlephobia.com/package/soulstate)
[![Version](https://img.shields.io/npm/v/soulstate)](https://www.npmjs.com/package/soulstate)

## 🎯 Positioning

SoulState is NOT a Zustand clone. While it maintains a familiar API, its internal architecture is a **Directed Acyclic Graph (DAG)** optimized for:

- **Sparse Update Supremacy**: Modifying 1 key in a 1,000-key store without touching unrelated subscribers.
- **Deep Propagation**: Deterministic invalidation and topological recomputation of deeply nested computed state.
- **Irrelevant Update Elimination**: Automatically skipping subscribers whose data usage pattern is unaffected by a specific change.
- **Deterministic Execution**: Stable microtask batching and glitch-free topological propagation ordering.

## 🚀 Performance Identity

SoulState excels where global-broadcast libraries struggle: high-density subscription environments.

### Honest Benchmark Summary
*100,000 subscribers, 100 keys, 1% update impact*

| Library | Sparse Update (hz) | Relevant Update (hz) | Identity |
| :--- | :--- | :--- | :--- |
| **SoulState** | **~250,900** | **~254,400** | **Surgical Graph Runtime** |
| Jotai | ~193,800 | ~194,000 | Atomic State |
| MobX | ~2,500 | ~2,500 | Reactive Object |
| Zustand | ~280 | ~33,800 | Global Broadcast |

> **Honest Tradeoff:** SoulState is a systems-grade runtime optimized for **update propagation**, not initialization. It is significantly slower than Zustand at creating subscribers because it must build a deterministic Directed Acyclic Graph (DAG) to ensure surgical performance and glitch-free consistency.

## 🏗️ Architecture

SoulState is built on three systems-grade pillars:

1.  **Invalidation Graph**: A reverse-dependency DAG that orchestrates surgical invalidation and recomputation.
2.  **Surgical Propagation Engine**: A level-based scheduler that ensures glitch-free updates in deterministic topological order.
3.  **Proxy-Based Tracking**: A reusable proxy-based tracking system that detects dependencies with minimal garbage collection pressure.

## 📦 Installation

```bash
npm install soulstate
```

## 🛠️ Usage

### Basic Store
```typescript
import { createStore } from 'soulstate';

const store = createStore({ 
  user: { name: 'Alice', settings: { theme: 'dark' } },
  notifications: [] 
});
```

### Surgical Reactivity
SoulState automatically tracks which keys your selector accesses. If you only use `user.name`, changes to `notifications` will **never** trigger a re-render or even a selector execution.

```tsx
import { useStore } from 'soulstate/react';

function Profile() {
  // Surgically tracks 'user.name'
  const name = useStore(store, s => s.user.name);
  return <h1>{name}</h1>;
}
```

### Computed & Derived State
SoulState's `computed` nodes are part of the core runtime—they are memoized, dependency-aware, and topologically stable.

```typescript
// Multi-dependency derived state
const visibleItems = store.computed(
  s => s.items,
  s => s.filter,
  (items, filter) => items.filter(i => i.type === filter)
);

// Access value
console.log(visibleItems.value);
```

### Transactions
Batch multiple updates into a single atomic propagation cycle with rollback support.

```typescript
store.beginTransaction();
store.setState({ a: 1 });
store.setState({ b: 2 });
if (error) store.rollbackTransaction();
else store.commitTransaction();
```

## 📈 Stress Scalability
SoulState is designed to handle **100,000+ subscribers** without degrading the UI thread. Its $O(M)$ propagation complexity (where $M$ is the number of affected nodes) ensures that your application remains responsive regardless of total state size.

## 🛡️ Instrumentation
Expose systems-grade diagnostics to identify propagation bottlenecks.

```typescript
store.enableInstrumentation({
  onFlush: (duration, keys) => console.log(`Flush took ${duration}ms for keys:`, keys),
  onSelectorRun: (name, duration) => console.log(`Selector ${String(name)} took ${duration}ms`)
});
```

## License
MIT © [Kasih Agustinus](https://github.com/kasihagustinusT)
