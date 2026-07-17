import { Middleware, State, StoreApi, StateCreator } from "../core/types";

export interface PersistOptions<T extends State> {
  key: string;
  storage?: Storage;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
}

export const persist =
  <T extends State>(config: PersistOptions<T>): Middleware<T> =>
  (creator) =>
  (set, get, api) => {
    const {
      key,
      storage = typeof window !== "undefined" ? localStorage : undefined,
      serialize = JSON.stringify,
      deserialize = JSON.parse,
    } = config;

    let lastPersisted = "";
    const initialState = creator(
      (updater, replace) => {
        set(updater, replace);
        if (storage) {
          try {
            const serialized = serialize(get());
            if (serialized !== lastPersisted) {
              storage.setItem(key, serialized);
              lastPersisted = serialized;
            }
          } catch (e) {
            console.error("SoulState: Persist failed", e);
          }
        }
      },
      get,
      api,
    );

    if (storage) {
      try {
        const stored = storage.getItem(key);
        if (stored) {
          const parsed = deserialize(stored);
          return { ...initialState, ...parsed };
        }
      } catch (e) {
        console.warn("SoulState: Rehydrate failed", e);
      }
    }

    return initialState;
  };
