import { Middleware } from './types';

/* -------------------------------------------------------
 * LOGGER MIDDLEWARE
 * -----------------------------------------------------*/
export const logger: Middleware = (_config) => (set, get, _api) => (partial) => {
  const prevState = get();
  console.group('SoulState Update');
  console.log('Previous State:', prevState);

  set(partial);

  const nextState = get();
  console.log('Next State:', nextState);
  console.groupEnd();

  return nextState;
};

/* -------------------------------------------------------
 * REDUX DEVTOOLS MIDDLEWARE
 * -----------------------------------------------------*/
export const reduxDevtools = (name?: string): Middleware => {
  return (_config) => (set, get, _api) => {
    if (typeof window === 'undefined') return set;

    const extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    if (!extension) return set;

    const devTools = extension.connect({ name: name || 'SoulState' });
    devTools.init(get());

    return (partial) => {
      const prevState = get();
      set(partial);
      const nextState = get();

      devTools.send('setState', nextState, prevState, name);

      return nextState;
    };
  };
};

/* -------------------------------------------------------
 * PERSIST MIDDLEWARE (FINAL FIXED)
 * -----------------------------------------------------*/

// ⚠️ NOTE:
// Generic harus ditempatkan SETELAH tanda "="
// untuk mencegah ESLint Parsing Error (“'{' expected”).
export const persistMiddleware =
  <T>(config: {
    key: string;
    storage?: Storage;
    serialize?: (state: T) => string;
    deserialize?: (str: string) => T;
  }): Middleware<T> =>
  (_config) =>
  (set, get, _api) => {
    const {
      key,
      storage = typeof window !== 'undefined' ? localStorage : undefined,
      serialize = JSON.stringify,
      deserialize = JSON.parse,
    } = config;

    if (!storage) return set;

    // Load persisted state safely
    try {
      const stored = storage.getItem(key);
      if (stored) {
        const parsed = deserialize(stored);
        if (parsed) {
          set(parsed);
        }
      }
    } catch (err) {
      console.warn('SoulState: Failed to load persisted state', err);
    }

    return (partial) => {
      set(partial);

      // Persist state after update
      try {
        storage.setItem(key, serialize(get()));
      } catch (err) {
        console.warn('SoulState: Failed to persist state', err);
      }

      return get();
    };
  };
