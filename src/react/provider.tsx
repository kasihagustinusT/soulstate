import * as React from "react";
import { StoreApi, State } from "../core/types";

const StoreContext = React.createContext<StoreApi<any> | null>(null);

export interface ProviderProps<T extends State> {
  store: StoreApi<T>;
  children: React.ReactNode;
}

export const Provider = <T extends State>({
  store,
  children,
}: ProviderProps<T>) => {
  return React.createElement(StoreContext.Provider, { value: store }, children);
};

export function useStoreContext<T extends State>(): StoreApi<T> {
  const store = React.useContext(StoreContext);
  if (!store) {
    throw new Error("useStoreContext must be used within a Provider");
  }
  return store;
}
