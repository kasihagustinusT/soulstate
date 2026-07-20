# SoulState Architecture

SoulState is a fine-grained reactive state management runtime built on three systems-grade pillars: **Invalidation Graph Propagation**, **Deterministic Scheduling**, and **Proxy-Based Tracking**.

## Core Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **StoreApi** | `src/core/store.ts` | Public interface: `getState`, `setState`, `subscribe`, `computed`, `destroy` |
| **Runtime** | `src/core/runtime.ts` | Central orchestrator managing state transitions and propagation pipeline |
| **InvalidationGraph** | `src/internals/graph.ts` | Directed Acyclic Graph mapping state keys to dependents |
| **SelectorRegistry** | `src/internals/invalidation.ts` | Proxy-based dependency tracking with bitmask fast paths |
| **SubscriptionManager** | `src/core/subscriptions.ts` | Dual linked-list system for global and granular subscribers |
| **Scheduler** | `src/core/scheduler.ts` | Microtask-based deterministic batching engine |
| **TransactionEngine** | `src/core/transactions.ts` | Transaction buffering with begin/commit/rollback lifecycle |
| **RuntimeMetrics** | `src/internals/metrics.ts` | Runtime observability: flush durations, selector runs, invalidations |

## Update Lifecycle

```
setState({ key: value })
    │
    ▼
┌─────────────────────┐
│ 1. State Apply      │  Synchronous state update
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 2. Key Detection    │  Identify changed top-level keys
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 3. Graph Invalidation│  Traverse DAG to find affected nodes
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 4. Microtask Schedule│  Defer propagation to next microtask
└─────────────────────┘
    │
    ▼ (next microtask)
┌─────────────────────┐
│ 5. Topological Sort  │  Level-based node ordering
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 6. Level-by-Level   │  Process nodes in dependency order
│    Propagation      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 7. Surgical Dispatch│  Notify only affected subscribers
└─────────────────────┘
```

## Key Algorithms

### Topological Leveling
Every node in the graph is assigned a level to prevent glitches:
- **Level 0**: State keys (roots)
- **Level 1**: Direct dependents (computeds/subscribers)
- **Level 2+**: Nested dependents

Updates process level-by-level, ensuring a node only executes after its dependencies settle.

### Irrelevant Update Elimination
1. **Surgical Filtering**: Graph knows exactly which subscribers need notification
2. **Equality Fast-Path**: If computed result is `Object.is` equal, propagation stops
3. **No-Op Skipping**: Identical state updates bypass the entire propagation cycle
4. **Bypass Fast-Path**: No granular listeners = bypass propagation engine

### Dual-Path Dispatch
- **Bitmask Path** (≤64 keys): Direct bitmask comparison, O(1) key lookup via 64-bit mask
- **Graph Path** (>64 keys): Full DAG traversal for complex dependency chains

## File Structure

```
src/
├── core/
│   ├── store.ts          # StoreApi creation and management
│   ├── runtime.ts        # Central orchestration engine
│   ├── subscriptions.ts  # Subscription management
│   ├── scheduler.ts      # Microtask batching
│   ├── transactions.ts   # Transaction support
│   ├── selectors.ts      # createSelector, selector, derived utilities
│   └── types.ts          # Core type definitions
├── internals/
│   ├── graph.ts          # InvalidationGraph implementation
│   ├── invalidation.ts   # Computed nodes and dependency tracking
│   └── metrics.ts        # Runtime observability
├── middleware/
│   ├── index.ts          # Middleware re-exports
│   ├── devtools.ts       # Redux DevTools integration
│   └── persist.ts        # Persistence middleware
├── utils/
│   ├── index.ts          # Utils re-exports
│   ├── batch.ts          # Batch utility (no-op wrapper)
│   ├── equality.ts       # objectIs (Object.is alias)
│   ├── shallow.ts        # Shallow comparison
│   └── slice.ts          # createSlice and combineSlices
├── react/
│   ├── index.ts          # React exports
│   ├── provider.tsx      # React context provider
│   ├── useStore.ts       # useStore hook
│   └── useShallow.ts     # useShallow hook
└── index.ts              # Main exports
```

## Design Principles

1. **Proxy-Based Tracking**: Reusable proxy-based dependency detection minimizes GC pressure
2. **Deterministic Updates**: Microtask batching ensures consistent propagation order
3. **Surgical Precision**: Only affected subscribers receive notifications
4. **Scalability**: Handles 100K+ subscribers with stable performance
5. **Glitch-Free**: Topological ordering prevents inconsistent intermediate states

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `setState` | O(1) | Immediate state apply |
| Key detection | O(k) | k = number of changed keys |
| Graph invalidation | O(d) | d = depth of affected subgraph |
| Subscription notification | O(m) | m = directly affected subscribers |
| Computed recompute | O(1) amortized | Cached until dependencies change |

## Related Documentation

- [System Architecture](https://soulstate.js.org/docs/advanced/architecture) - Detailed architecture deep-dive
- [Core Engine](https://soulstate.js.org/docs/internals/engine) - Engine implementation details
- [Mutation Lifecycle](https://soulstate.js.org/docs/internals/mutation) - State mutation internals
- [Subscription Management](https://soulstate.js.org/docs/internals/linked-list) - Linked-list implementation
