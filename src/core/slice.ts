import { StoreApi } from './types';

export interface Slice<T, S = any> {
  name: string;
  initialState: T;
  reducers?: {
    [key: string]: (state: T, payload?: any) => T | void;
  };
  selectors?: {
    [key: string]: (state: S) => any;
  };
  effects?: {
    [key: string]: (store: StoreApi<S>) => (...args: any[]) => void | Promise<void>;
  };
}

export function createSlice<T, S = any>(config: Slice<T, S>) {
  return config;
}

export function combineSlices<S>(slices: { [K in keyof S]: Slice<any, S> }): {
  initialState: S;
  reducers: any;
  selectors: any;
} {
  const initialState = {} as S;
  const reducers: any = {};
  const selectors: any = {};

  (Object.keys(slices) as Array<keyof S>).forEach(key => {
    const slice = slices[key];
    initialState[key] = slice.initialState;
    
    if (slice.reducers) {
      reducers[key as string] = slice.reducers;
    }
    
    if (slice.selectors) {
      selectors[key as string] = slice.selectors;
    }
  });

  return { initialState, reducers, selectors };
}
