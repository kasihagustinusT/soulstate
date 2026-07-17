import { useSyncExternalStore, useRef, useMemo } from "react";
import { StoreApi, Selector, State } from "../core/types";
import { objectIs } from "../utils/equality";

export function useStore<T extends State, S>(
  api: StoreApi<T>,
  selector: Selector<T, S>,
  equalityFn: (a: S, b: S) => boolean = objectIs,
): S {
  const cacheRef = useRef({
    selector,
    equalityFn,
    node: null as any,
    lastVersion: -1,
    lastSelectedState: undefined as S | undefined,
  });

  cacheRef.current.selector = selector;
  cacheRef.current.equalityFn = equalityFn;

  const { subscribe, getSnapshot } = useMemo(() => {
    const stableSelector = (state: T) => cacheRef.current.selector(state);
    const stableEquality = (a: any, b: any) =>
      cacheRef.current.equalityFn(a, b);

    (stableSelector as any)._ss_selector = selector;

    return {
      subscribe: (onStoreChange: () => void) => {
        const unsub = api.subscribe(stableSelector, onStoreChange, {
          equalityFn: stableEquality,
        });
        cacheRef.current.node = (unsub as any).node;
        return unsub;
      },
      getSnapshot: () => {
        const cache = cacheRef.current;
        const version = api.getVersion();

        if (cache.node && cache.node._lastNotifiedId > 0) {
          return cache.node.lastSelectedState;
        }

        if (
          version === cache.lastVersion &&
          cache.lastSelectedState !== undefined
        ) {
          return cache.lastSelectedState;
        }

        const nextSelected = cache.selector(api.getState());
        if (
          cache.lastSelectedState !== undefined &&
          cache.equalityFn(nextSelected, cache.lastSelectedState)
        ) {
          cache.lastVersion = version;
          return cache.lastSelectedState;
        }

        cache.lastVersion = version;
        cache.lastSelectedState = nextSelected;
        return nextSelected;
      },
    };
  }, [api]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
