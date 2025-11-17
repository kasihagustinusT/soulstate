// For a Zustand-like library, a Provider is often optional, as stores are module-level singletons.
// However, it can be useful for request-scoped stores in SSR or for dependency injection.

import * as React from 'react';
import { Store } from '../core/store';

const StoreContext = React.createContext<Store<any> | null>(null);

export const Provider = <T,>({
  store,
  children,
}: {
  store: Store<T>;
  children: React.ReactNode;
}) => {
  return React.createElement(StoreContext.Provider, { value: store }, children);
};

export function useStoreContext<T>(): Store<T> {
  const store = React.useContext(StoreContext);
  if (!store) {
    throw new Error('useStoreContext must be used within a Provider');
  }
  return store;
}