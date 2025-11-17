export type Listener<T = any> = (state: T, prevState: T) => void;
export type Selector<T, R> = (state: T) => R;
export type EqualityFn<T> = (a: T, b: T) => boolean;
export type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
export type GetState<T> = () => T;
export type Subscribe = (listener: Listener) => () => void;
export type Destroy = () => void;

export interface StoreApi<T> {
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe;
  destroy: Destroy;
}

export interface EnhancedStoreApi<T> extends StoreApi<T> {
  batch: (callback: () => void) => void;
}

export interface StoreConfig<T> {
  name?: string;
  middleware?: Middleware<T>[];
  devtools?: boolean;
  persistence?: PersistenceConfig<T>;
}

export interface PersistenceConfig<T> {
  key: string;
  storage?: Storage;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
  migrate?: (persistedState: any, version: number) => T;
}

export type Middleware<T = any> = (
  config: StoreApi<T>
) => (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => SetState<T>;
