import { Middleware } from './types';

export const logger: Middleware = (config) => (set, get, api) => (partial) => {
  const prevState = get();
  console.group('SoulState Update');
  console.log('Previous State:', prevState);
  
  set(partial);
  
  const nextState = get();
  console.log('Next State:', nextState);
  console.groupEnd();
  
  return nextState;
};

export const reduxDevtools = (name?: string): Middleware => {
  return (config) => (set, get, api) => {
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

export const persistMiddleware = <T>(config: {
  key: string;
  storage?: Storage;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
}): Middleware<T> => {
  return (storeApi) => (set, get, api) => {
    const {
      key,
      storage = typeof window !== 'undefined' ? localStorage : undefined,
      serialize = JSON.stringify,
      deserialize = JSON.parse,
    } = config;
    
    if (!storage) return set;
    
    // Load persisted state
    try {
      const stored = storage.getItem(key);
      if (stored) {
        const parsedState = deserialize(stored);
        if (parsedState) {
          set(parsedState);
        }
      }
    } catch (error) {
      console.warn('SoulState: Failed to load persisted state', error);
    }
    
    return (partial) => {
      set(partial);
      
      // Persist after update
      try {
        storage.setItem(key, serialize(get()));
      } catch (error) {
        console.warn('SoulState: Failed to persist state', error);
      }
      
      return get();
    };
  };
};
