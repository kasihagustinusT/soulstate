import { createSubscriptionManager } from './subscriptions';

type StateUpdater<T> = Partial<T> | ((state: T) => Partial<T> | T);

export interface Store<T> {
  get: () => T;
  set: (updater: StateUpdater<T>) => void;
  subscribe: <S>(
    selector: (state: T) => S,
    listener: (selectedState: S, prevSelectedState: S) => void,
    options?: { equalityFn?: (a: S, b: S) => boolean }
  ) => () => void;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state: T = initialState;
  const subscriptionManager = createSubscriptionManager<T>();

  let isNotificationScheduled = false;
  let lastKnownState = state;

  const notifySubscribers = () => {
    subscriptionManager.notify(state, lastKnownState);
    lastKnownState = state;
    isNotificationScheduled = false;
  };

  const scheduleNotification = () => {
    if (!isNotificationScheduled) {
      isNotificationScheduled = true;
      queueMicrotask(notifySubscribers);
    }
  };

  const get = (): T => state;

  const set = (updater: StateUpdater<T>) => {
    const partialState = typeof updater === 'function'
      ? (updater as (state: T) => Partial<T> | T)(state)
      : updater;

    if (Object.is(partialState, state) || partialState === undefined) {
      return;
    }

    // --- Minimal Structural Sharing ---
    // Instead of spreading blindly, check if any value has actually changed.
    let hasChanged = false;
    const updatedKeys = Object.keys(partialState);
    for (let i = 0; i < updatedKeys.length; i++) {
      const key = updatedKeys[i] as keyof T;
      if (!Object.is(state[key], (partialState as T)[key])) {
        hasChanged = true;
        break;
      }
    }

    if (!hasChanged) {
      return; // No actual change, so we bail out early, avoiding new object creation.
    }
    
    // Only create a new object if something has truly changed.
    const nextState = { ...state, ...(partialState as Partial<T>) };
    state = nextState;
    
    scheduleNotification();
  };

  const subscribe = <S>(
    selector: (state: T) => S,
    listener: (selectedState: S, prevSelectedState: S) => void,
    options?: { equalityFn?: (a: S, b: S) => boolean }
  ) => {
    return subscriptionManager.subscribe(selector, listener, options?.equalityFn, state);
  };

  // Batch and Atomic are now effectively provided by automatic microtask batching,
  // but we can keep them for semantic purposes or complex multi-store transactions.
  // For now, they are removed to reflect the new, simpler, and more powerful core.
  return {
    get,
    set,
    subscribe,
  };
}
