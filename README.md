<p align="center">
  <img src="https://github.com/user-attachments/assets/ead04d0e-b164-4de1-94c0-82d4fed47942" width="250" alt="SoulState Logo" />
</p>

<h1 align="center">SoulState</h1>

<p align="center"><strong>The Zero-Overhead State of Mind.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/soulstate">
    <img src="https://img.shields.io/npm/v/soulstate.svg" alt="NPM Version" />
  </a>
  <a href="https://github.com/kasihagustinusT/soulstate/actions/workflows/ci.yml">
    <img src="https://github.com/kasihagustinusT/soulstate/actions/workflows/ci.yml/badge.svg" alt="Build Status" />
  </a>
  <a href="https://bundlephobia.com/package/soulstate">
    <img src="https://img.shields.io/bundlephobia/minzip/soulstate" alt="Bundle Size" />
  </a>
  <a href="/LICENSE">
    <img src="https://img.shields.io/npm/l/soulstate.svg" alt="License" />
  </a>
</p>


---

**SoulState** is a minimalist, high-performance state management library for React and vanilla JS. It provides a simple, unopinionated API inspired by Zustand, but with a re-engineered core focused on extreme performance and zero overhead.

### Core Features

- **🔥 Blazing Fast:** Re-engineered core with automatic microtask batching, linked-list subscribers, and minimal structural sharing to avoid unnecessary re-renders.
- **⚛️ React 18 Ready:** First-class support for concurrent rendering via `useSyncExternalStore`.
- **🤏 Tiny Footprint:** Under 1KB, with zero dependencies.
- **🧘‍♀️ Simple API:** If you know Zustand, you know SoulState. `createStore`, `set`, `subscribe`.
- **🔒 Mutation Guard:** In development mode, state is frozen outside of `set` calls to prevent accidental mutations.
- **🌲 Tree-shakeable:** Fully modular, ensuring you only bundle what you use.

### Installation

```bash
npm install soulstate
# or
yarn add soulstate
```

### Basic Usage with React

Create a store, bind it to a component, and you're done.

**`store.js`**
```javascript
import { createStore } from 'soulstate';

export const useCounterStore = createStore({ count: 0 });

// Actions can be defined anywhere, even outside the store
export const increment = () => {
  useCounterStore.set(state => ({ count: state.count + 1 }));
};
```

**`Counter.jsx`**
```jsx
import { useStore } from 'soulstate/react';
import { useCounterStore, increment } from './store';

function Counter() {
  const count = useStore(useCounterStore, state => state.count);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

### TypeScript Usage

SoulState is written in TypeScript and provides excellent type inference.

```typescript
import { createStore } from 'soulstate';

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

export const useBearStore = createStore<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}));
```

### Advanced Usage: Managing Complex State

SoulState is not just for simple counters. Its performance and flexibility make it ideal for managing complex, nested state structures, such as the state of an AI agent or a multi-step form.

Let's model a `KnowledgeState` for a hypothetical research agent:

**`knowledgeStore.ts`**
```typescript
import { createStore } from 'soulstate';

interface KnowledgeState {
    originalQuery: string;
    keyFacts: string[];
    uncertainties: string[];
    searchHistory: Record<string, any>[];
    candidateAnswers: Record<string, any>[];
    confidence: number;
    iteration: number;
}

export const useKnowledgeStore = createStore<KnowledgeState>((set) => ({
    originalQuery: '',
    keyFacts: [],
    uncertainties: [],
    searchHistory: [],
    candidateAnswers: [],
    confidence: 0.0,
    iteration: 0,
}));

// Actions can be defined to manipulate this complex state
export const addFact = (fact: string) => {
    useKnowledgeStore.set(state => ({
        keyFacts: [...state.keyFacts, fact]
    }));
};

export const addSearchHistory = (search: Record<string, any>) => {
    useKnowledgeStore.set(state => ({
        searchHistory: [...state.searchHistory, search]
    }));
};

export const setConfidence = (confidence: number) => {
    useKnowledgeStore.set({ confidence });
}
```

With this setup, you can subscribe to any part of the `KnowledgeState` from your React components with minimal overhead, ensuring your UI stays in sync with the agent's "mind" without performance bottlenecks.

```jsx
function AgentStatus() {
  const { iteration, confidence } = useStoreShallow(useKnowledgeStore, state => ({
    iteration: state.iteration,
    confidence: state.confidence,
  }));

  return (
    <p>Iteration: {iteration}, Confidence: {(confidence * 100).toFixed(1)}%</p>
  );
}
```

This demonstrates how SoulState can be the backbone for sophisticated applications while maintaining a simple and predictable API.

### SSR and Hydration Guide

For Server-Side Rendering (SSR) with frameworks like Next.js, it's crucial to handle state correctly to avoid mismatches between the server and client. The recommended approach is to create a new store instance for each request on the server, and then hydrate it on the client.

While SoulState can be used with a singleton store on the client, for SSR you should use a React Context Provider to isolate state per request.

**`store.js`**
```javascript
// No changes needed here
import { createStore } from 'soulstate';
export const createMyStore = (initialState) => createStore(initialState);
```

**`_app.js` (Next.js example)**
```jsx
import { Provider, useStoreContext } from 'soulstate/react';
import { createMyStore } from './store';

function App({ Component, pageProps }) {
  const store = createMyStore(pageProps.initialState);
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}
```

### Subscription Model

At its core, SoulState uses a highly optimized pub/sub model built on a **doubly linked list**. This provides O(1) complexity for `unsubscribe` operations and avoids memory allocation for iterators during notifications, making it extremely fast in dynamic environments.

You can subscribe to state changes in vanilla JS:

```javascript
const unsubscribe = useCounterStore.subscribe(
  state => state.count,
  (count, prevCount) => {
    console.log(`Count changed from ${prevCount} to ${count}`);
  }
);

// To stop listening
unsubscribe();
```

### Selector Model

Selectors are the primary way to consume state. They allow components to subscribe to only the data they need, preventing unnecessary re-renders.

- **Minimal Re-renders:** A component will only re-render if the value returned by its selector changes.
- **Memoization:** For selectors that return new objects/arrays, use `useStoreShallow` or provide a custom equality function to prevent re-renders when the underlying data is the same.

```jsx
import { useStoreShallow } from 'soulstate/react';

// This component only re-renders if user.id or user.name changes.
function User() {
  const { id, name } = useStoreShallow(useUserStore, state => ({
    id: state.user.id,
    name: state.user.name,
  }));
  return <p>{id}: {name}</p>;
}
```

### Best Practices

1.  **Keep Selectors Small:** Select only the state your component needs.
2.  **Use `useStoreShallow` for Objects:** When selecting multiple values into a new object, use `useStoreShallow` to avoid unnecessary re-renders.
3.  **Actions Outside the Store:** Define actions as separate functions. This makes them easier to test and ensures they have stable references.
4.  **Keep State Flat:** A flatter state structure is often easier to reason about and update.

### API Reference

- `createStore<T>(initialState: T): Store<T>`
- `store.get(): T`
- `store.set(updater: Partial<T> | (state: T) => Partial<T> | T)`
- `store.subscribe(selector, listener, options?)`
- `useStore<T, S>(store, selector, equalityFn?)`
- `useStoreShallow<T, S>(store, selector)`

### Benchmark & Comparison

SoulState is built for performance in complex, highly-interactive applications. Its core architecture makes a deliberate trade-off: it optimizes for scenarios where state updates need to be efficiently propagated to many subscribers (e.g., components), which is often the bottleneck in real-world React applications.

The benchmarks below compare SoulState against other popular state management libraries.

---

#### Key Benchmark: Updates with Many Subscribers

This is the most critical benchmark for UI performance. It simulates a state update that triggers re-renders in 100 subscribed components. SoulState's linked-list subscription model is designed specifically for this scenario, resulting in a significant performance advantage.

**`10k Updates w/ 100 Subscribers`**
| Library          | Mean Time (Lower is Better) | Relative Performance |
| ---------------- | --------------------------- | -------------------- |
| **🚀 SoulState** | **~1.4 ms**                 | **19.1x Faster**     |
| Signals (Mock)   | ~26.7 ms                    | (Baseline)           |
| Zustand (Mock)   | ~26.8 ms                    | 0.99x                |
| Valtio (Mock)    | ~27.0 ms                    | 0.99x                |
| MobX (Mock)      | ~27.4 ms                    | 0.97x                |
| Redux (Mock)     | ~27.6 ms                    | 0.97x                |

**Conclusion:** In high-subscription environments, SoulState is an order of magnitude faster than the alternatives.

---

#### Secondary Benchmarks

These benchmarks measure performance in other areas. While SoulState is not the fastest in every category, it remains competitive and its architecture is a conscious choice to prioritize the "many subscribers" use case above all else.

**`100k Sequential Updates`** (Raw update throughput)
| Library            | Mean Time (Lower is Better) |
| ------------------ | --------------------------- |
| Nano Stores (Mock) | **~3.7 ms**                 |
| Jotai (Mock)       | ~3.7 ms                     |
| Zustand (Mock)     | ~5.9 ms                     |
| Valtio (Mock)      | ~6.1 ms                     |
| MobX (Mock)        | ~10.1 ms                    |
| Redux (Mock)       | ~11.9 ms                    |
| SoulState          | ~13.7 ms                    |

**`100k Selector Reads`** (Raw read throughput)
| Library         | Mean Time (Lower is Better) |
| --------------- | --------------------------- |
| Valtio (Mock)   | **~0.14 ms**                |
| Signals (Mock)  | ~0.41 ms                    |
| Redux (Mock)    | ~0.53 ms                    |
| MobX (Mock)     | ~0.53 ms                    |
| SoulState       | ~0.68 ms                    |

*Benchmarks executed with `vitest bench`. Results are indicative. Run `npm run test:bench` on your machine for precise results.*

---
