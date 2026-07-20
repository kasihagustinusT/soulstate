# SoulState API Compatibility Snapshot
# Generated: 2026-07-17
# This file documents the stable public API surface for v1.x releases.
# Any changes to this file require a minor or major version bump.

## Entry Points

| Package | Path | Description |
|---------|------|-------------|
| `soulstate` | `.` | Main entry - all core APIs |
| `soulstate/react` | `./react` | React integration |
| `soulstate/middleware` | `./middleware` | Persistence and DevTools middleware |
| `soulstate/utils` | `./utils` | Utility functions |

## Core API

### Functions

| Symbol | Signature | Description |
|--------|-----------|-------------|
| `createStore` | `<T extends State>(creator: StateCreator<T> \| T): StoreApi<T>` | Creates a new store instance |

### Types

| Symbol | Definition |
|--------|-----------|
| `DependencyKey` | `string \| symbol` |
| `State` | `Record<DependencyKey, any>` |
| `PartialState<T>` | `Partial<T> \| StateUpdater<T>` |
| `StateUpdater<T>` | `(state: T) => Partial<T> \| T` |
| `Selector<T, S>` | `(state: T) => S` |
| `Listener<S>` | `(state: S, prevState: S) => void` |
| `EqualityFn<S>` | `(a: S, b: S) => boolean` |
| `StateCreator<T>` | `(set, get, api) => T` |
| `Middleware<T>` | `(creator: StateCreator<T>) => StateCreator<T>` |

### Interfaces

| Symbol | Members |
|--------|---------|
| `StoreApi<T>` | `getState`, `getVersion`, `setState`, `subscribe`, `beginTransaction`, `commitTransaction`, `rollbackTransaction`, `computed`, `enableInstrumentation`, `destroy`, `getMetrics` |
| `Computed<T>` | `readonly value: T`, `readonly name?: string \| symbol`, `destroy(): void` |
| `Derived<T>` | extends `Computed<T>` + `dependencies: Set<Computed<any> \| string \| symbol>` |
| `SubscribeOptions<S>` | `equalityFn?: EqualityFn<S>` |
| `RuntimeInstrumentation` | `onFlush?`, `onSelectorRun?`, `onInvalidate?`, `onRender?` |

## Scheduler API

| Symbol | Signature | Description |
|--------|-----------|-------------|
| `scheduleTask` | `(task: () => void): void` | Schedules a microtask |
| `flushSync` | `<T>(callback: () => T): T` | Synchronously flushes pending updates |

## Selector API

| Symbol | Signature | Description |
|--------|-----------|-------------|
| `createSelector` | `<T, S, R>(selector, combiner, equalityFn?): Selector<T, R>` | Creates a memoized selector |
| `selector` | `<T, S>(fn: Selector<T, S>): Selector<T, S>` | Identity selector for type inference |
| `derived` | `<T, S, R>(...deps, combiner): Selector<T, R>` | Composable derived state |

## React API

| Symbol | Signature | Description |
|--------|-----------|-------------|
| `useStore` | `<T, S>(api, selector, equalityFn?): S` | React hook for store access |
| `Provider` | `<T>(props: ProviderProps<T>): ReactElement` | React context provider |
| `useStoreContext` | `<T>(): StoreApi<T>` | Access store from context |
| `useShallow` | `<T, S>(api, selector): S` | Shallow equality selector hook |

### Interfaces

| Symbol | Members |
|--------|---------|
| `ProviderProps<T>` | `store: StoreApi<T>`, `children: React.ReactNode` |

## Middleware API

| Symbol | Signature | Description |
|--------|-----------|-------------|
| `persist` | `<T>(config: PersistOptions<T>): Middleware<T>` | Persistence middleware |
| `devtools` | `<T>(options?: DevToolsOptions): Middleware<T>` | Redux DevTools middleware |

### Interfaces

| Symbol | Members |
|--------|---------|
| `PersistOptions<T>` | `key: string`, `storage?: Storage`, `serialize?: (state: T) => string`, `deserialize?: (str: string) => T` |
| `DevToolsOptions` | `name?: string`, `enabled?: boolean` |

## Utilities API

| Symbol | Signature | Description |
|--------|-----------|-------------|
| `batch` | `(callback: () => void): void` | No-op wrapper (automatic microtask batching handles batching) |
| `objectIs` | `Object.is` | Reference equality check |
| `shallow` | `<T, U>(a: T, b: U): boolean` | Shallow equality comparison |
| `useShallow` | `<T, S>(api, selector): S` | Shallow equality hook |
| `createSlice` | `<TState, TName, TReducers>(options): StateCreator` | Creates a state slice |
| `combineSlices` | `(...slices): StateCreator` | Combines multiple slices |

### Interfaces

| Symbol | Members |
|--------|---------|
| `SliceOptions<TState, TName, TReducers>` | `name: TName`, `initialState: TState`, `reducers: TReducers` |

## Backward Compatibility Rules

1. No renamed exported symbols
2. No removed exported APIs
3. No hidden breaking changes
4. New optional parameters may be added
5. New types may be added
6. New interfaces may be extended
7. New exports may be added
8. Return types must remain compatible
9. Generic constraints may be loosened (not tightened)
10. Default parameter values must remain the same
