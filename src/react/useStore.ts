import * as React from 'react';
import { Store } from '../core/store';
import { objectIs } from '../utils/equality';
import { shallow } from '../utils/shallow';

// React 18's useSyncExternalStore is the gold standard for external state
const useSyncExternalStore =
  React.useSyncExternalStore ||
  ((subscribe, getSnapshot) => {
    const value = getSnapshot();
    const [state, setState] = React.useState(value);
    React.useLayoutEffect(() => {
      const unsubscribe = subscribe(() => {
        const nextValue = getSnapshot();
        if (!Object.is(value, nextValue)) {
          setState(nextValue);
        }
      });
      return unsubscribe;
    }, [subscribe, getSnapshot]);
    return state;
  });

export function useStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  equalityFn: (a: S, b: S) => boolean = objectIs
): S {
  const getSnapshot = React.useCallback(() => selector(store.get()), [store, selector]);

  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = store.subscribe(selector, onStoreChange, { equalityFn });
      return unsubscribe;
    },
    [store, selector, equalityFn]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return value;
}

// Common selectors
export const useShallow = <T, S>(store: Store<T>, selector: (state: T) => S) => useStore(store, selector, shallow);