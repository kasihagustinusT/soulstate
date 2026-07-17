/**
 * SoulState Selector Engine
 * Provides high-level APIs for computed and derived state.
 */

import { State, Selector, Computed } from "./types";
import { objectIs } from "../utils/equality";

/**
 * Creates a memoized selector.
 * Provides stable results for identical input slices.
 */
export function createSelector<T extends State, S, R>(
  selector: Selector<T, S>,
  combiner: (val: S) => R,
  equalityFn: (a: S, b: S) => boolean = objectIs,
): Selector<T, R> {
  let lastSlice: S;
  let lastResult: R;
  let hasRun = false;

  return (state: T) => {
    const slice = selector(state);
    if (hasRun && equalityFn(slice, lastSlice)) {
      return lastResult;
    }
    lastSlice = slice;
    lastResult = combiner(slice);
    hasRun = true;
    return lastResult;
  };
}

/**
 * Creates a reusable selector.
 * Identity function used primarily for type inference.
 */
export function selector<T extends State, S>(
  fn: Selector<T, S>,
): Selector<T, S> {
  return fn;
}

/**
 * Composable derived state utility.
 */
export function derived<T extends State, S extends any[], R>(
  ...args: [
    ...{ [K in keyof S]: Selector<T, S[K]> | Computed<S[K]> },
    (...vals: S) => R,
  ]
): Selector<T, R> {
  const combiner = args.pop() as (...vals: S) => R;
  const deps = args as { [K in keyof S]: Selector<T, S[K]> | Computed<S[K]> };

  return (state: T) => {
    const vals = deps.map((dep) =>
      dep && typeof dep === "object" && "value" in dep
        ? (dep as Computed<any>).value
        : (dep as Selector<T, any>)(state),
    ) as unknown as S;
    return combiner(...vals);
  };
}
