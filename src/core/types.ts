/**
 * SoulState Core Types
 * Optimized for performance and TypeScript inference.
 */

export type DependencyKey = string | symbol;

export type State = Record<DependencyKey, any>;

/**
 * A function that returns a partial state or a full state.
 */
export type StateUpdater<T extends State> = (state: T) => Partial<T> | T;

/**
 * Partial state or an updater function.
 */
export type PartialState<T extends State> = Partial<T> | StateUpdater<T>;

/**
 * A listener function that is called when the selected state changes.
 */
export type Listener<S> = (state: S, prevState: S) => void;

/**
 * A selector function to extract a slice of the state.
 */
export type Selector<T extends State, S> = (state: T) => S;

/**
 * A function to check if two states are equal.
 */
export type EqualityFn<S> = (a: S, b: S) => boolean;

/**
 * Options for the subscribe method.
 */
export interface SubscribeOptions<S> {
  /**
   * Custom equality function to determine if the selected state has changed.
   * Defaults to Object.is.
   */
  equalityFn?: EqualityFn<S>;
}

/**
 * Computed State Interface
 */
export interface Computed<T> {
  readonly value: T;
  readonly name?: string | symbol;
  /**
   * Destroys the computed node and cleans up its dependencies.
   */
  destroy(): void;
}

/**
 * Derived State Interface
 */
export interface Derived<T> extends Computed<T> {
  readonly dependencies: Set<Computed<any> | string | symbol>;
}

/**
 * Instrumentation Hooks
 */
export interface RuntimeInstrumentation {
  onFlush?: (duration: number, changedKeys: Set<string | symbol>) => void;
  onSelectorRun?: (name: string | symbol, duration: number) => void;
  onInvalidate?: (key: string | symbol) => void;
  onRender?: (count: number) => void;
}

/**
 * The core API of a SoulState store.
 */
export interface StoreApi<T extends State> {
  /**
   * Returns the current state.
   */
  getState: () => T;
  /**
   * Returns the current state version.
   */
  getVersion: () => number;
  /**
   * Updates the state.
   * @param updater Partial state or an updater function.
   * @param replace If true, the state will be replaced entirely instead of merged.
   * @param sync If true, the update will be flushed synchronously (bypassing batching).
   */
  setState: (
    updater: PartialState<T>,
    replace?: boolean,
    sync?: boolean,
  ) => void;
  /**
   * Subscribes to state changes.
   * @param selector A function to select a slice of the state.
   * @param listener A function called when the selected slice changes.
   * @param options Subscription options.
   * @returns An unsubscribe function.
   */
  subscribe: <S>(
    selector: Selector<T, S>,
    listener: Listener<S>,
    options?: SubscribeOptions<S>,
  ) => () => void;
  /**
   * Begins a transaction. Updates within a transaction are batched until committed.
   */
  beginTransaction: () => void;
  /**
   * Commits the current transaction, applying all buffered updates.
   */
  commitTransaction: () => void;
  /**
   * Rolls back the current transaction, discarding all buffered updates.
   */
  rollbackTransaction: () => void;
  /**
   * Creates a computed state slice.
   * Supports both single selector and multi-dependency computed values.
   */
  computed: {
    <S>(selector: Selector<T, S>, name?: string): Computed<S>;
    <S extends any[], R>(
      ...args: [
        ...{ [K in keyof S]: Selector<T, S[K]> | Computed<S[K]> },
        (...vals: S) => R,
      ]
    ): Computed<R>;
  };
  /**
   * Enables runtime profiling and instrumentation.
   */
  enableInstrumentation: (options?: RuntimeInstrumentation) => void;
  /**
   * Destroys the store and removes all listeners.
   */
  destroy: () => void;
  /**
   * Returns a snapshot of the runtime metrics.
   */
  getMetrics: () => any;
}

/**
 * A function used to create the initial state and define actions.
 */
export type StateCreator<
  T extends State,
  Mis extends [Middleware, any][] = [],
  Mos extends [Middleware, any][] = [],
> = (
  set: StoreApi<T>["setState"],
  get: StoreApi<T>["getState"],
  api: StoreApi<T>,
) => T;

/**
 * Middleware type for extending SoulState functionality.
 */
export type Middleware<T extends State = any> = (
  creator: StateCreator<T>,
) => StateCreator<T>;
