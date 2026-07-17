import {
  State,
  StoreApi,
  StateCreator,
  Selector,
  Listener,
  SubscribeOptions,
  DependencyKey,
} from "./types";
import {
  SubscriptionManager,
  FLAG_BYPASS_CHECK,
  globalUnsubscribePool,
} from "./subscriptions";
import { Runtime } from "./runtime";
import { objectIs } from "../utils/equality";
import { InvalidationGraph } from "../internals/graph";
import {
  SelectorRegistry,
  FLAG_PENDING_TRACKING,
} from "../internals/invalidation";
import { RuntimeMetrics } from "../internals/metrics";

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isDev =
  typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";

function invariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[SoulState] ${message}`);
  }
}

function devWarning(condition: boolean, message: string): void {
  if (!condition && isDev) {
    console.warn(`[SoulState] ${message}`);
  }
}

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeState<T extends Record<string, any>>(obj: T): T {
  const keys = Object.keys(obj);
  let hasDangerous = false;
  for (let i = 0; i < keys.length; i++) {
    if (DANGEROUS_KEYS.has(keys[i])) {
      hasDangerous = true;
      break;
    }
  }
  if (!hasDangerous) return obj;
  const safe: any = Object.create(null);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!DANGEROUS_KEYS.has(key)) {
      safe[key] = (obj as any)[key];
    }
  }
  return safe as T;
}

function safeMerge<T extends Record<string, any>>(target: T, source: any): T {
  const keys = Object.keys(source);
  const result = Object.create(Object.getPrototypeOf(target));
  const targetKeys = Object.keys(target);
  for (let i = 0; i < targetKeys.length; i++) {
    result[targetKeys[i]] = (target as any)[targetKeys[i]];
  }
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!DANGEROUS_KEYS.has(key)) {
      result[key] = source[key];
    }
  }
  return result;
}

export function createStore<T extends State>(
  creator: StateCreator<T> | T,
): StoreApi<T> {
  invariant(
    typeof creator === "function" ||
      (typeof creator === "object" && creator !== null),
    "createStore requires a state creator function or initial state object",
  );

  const graph = new InvalidationGraph();
  const subscriptions = new SubscriptionManager<T>(graph);
  const metrics = new RuntimeMetrics();

  const selectors: SelectorRegistry<T> = new SelectorRegistry<T>(
    graph,
    metrics,
    () => runtime.getVersion(),
  );
  graph.setKeyRegistry(selectors);

  const runtime: Runtime<T> = new Runtime<T>(
    {} as T,
    subscriptions,
    graph,
    selectors,
    metrics,
  );
  let destroyed = false;

  const api: StoreApi<T> = {
    getState: () => {
      devWarning(!destroyed, "getState called on a destroyed store");
      return runtime.getState();
    },
    getVersion: () => runtime.getVersion(),
    setState: (updater, replace, sync) => {
      invariant(!destroyed, "Cannot update state on a destroyed store");
      invariant(
        typeof updater === "function" ||
          (typeof updater === "object" && updater !== null),
        "setState requires a partial state object or updater function",
      );
      const currentState = runtime.getState();
      const nextPartialState =
        typeof updater === "function"
          ? (updater as any)(currentState)
          : updater;
      if (nextPartialState !== currentState) {
        if (
          replace ||
          typeof nextPartialState !== "object" ||
          nextPartialState === null
        ) {
          runtime.setState(nextPartialState as T, undefined, sync);
        } else {
          const hasGranular = runtime.hasGranularListeners;
          let hasChanged = false;
          let changedKeys: DependencyKey[] | undefined;
          const keys = Object.keys(nextPartialState);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (
              !objectIs(
                (currentState as any)[key],
                (nextPartialState as any)[key],
              )
            ) {
              hasChanged = true;
              if (hasGranular) {
                if (!changedKeys) changedKeys = [];
                changedKeys.push(key as DependencyKey);
              } else break;
            }
          }
          if (hasChanged)
            runtime.setState(
              safeMerge(currentState, nextPartialState),
              changedKeys,
              sync,
            );
        }
      }
    },
    subscribe: <S>(
      selector: Selector<T, S>,
      listener: Listener<S>,
      options?: SubscribeOptions<S>,
    ) => {
      invariant(!destroyed, "Cannot subscribe to a destroyed store");
      invariant(
        typeof selector === "function",
        "subscribe requires a selector function",
      );
      invariant(
        typeof listener === "function",
        "subscribe requires a listener function",
      );
      const currentState = runtime.getState();
      const equalityFn = options?.equalityFn || objectIs;
      const initialValue = selector(currentState);

      const node = subscriptions.add(
        selector,
        listener,
        equalityFn,
        initialValue,
        true,
      );
      node._flags |= FLAG_PENDING_TRACKING;

      if ((selector as any)._ss_selector) {
        node._flags |= FLAG_BYPASS_CHECK;
      }

      return globalUnsubscribePool.get(node, subscriptions);
    },
    beginTransaction: () => {
      invariant(!destroyed, "Cannot begin transaction on a destroyed store");
      runtime.beginTransaction();
    },
    commitTransaction: () => runtime.commitTransaction(),
    rollbackTransaction: () => runtime.rollbackTransaction(),
    computed: (...args: any[]) => {
      invariant(!destroyed, "Cannot create computed on a destroyed store");
      invariant(
        args.length > 0,
        "computed requires at least one argument (selector or combiner)",
      );
      return runtime.computed(...args);
    },
    enableInstrumentation: (options) => runtime.enableInstrumentation(options),
    destroy: () => {
      destroyed = true;
      subscriptions.clear();
      selectors.clear();
      graph.clear();
    },
    getMetrics: () => runtime.getMetrics(),
  };

  const initialState =
    typeof creator === "function"
      ? (creator as any)(api.setState, api.getState, api)
      : creator;
  (runtime as any).state = sanitizeState(initialState);
  (runtime as any).prevState = sanitizeState(initialState);
  return api;
}
