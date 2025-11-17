// This file will contain the main exports for the library.

export { createStore } from './core/store';
export type { Store } from './core/store';
export { useStore, useShallow } from './react/useStore';
export { Provider, useStoreContext } from './react/provider';
export { shallow } from './utils/shallow';

// We will leave middleware and slice for a future step to keep this concise.
// export { createSlice } from './core/slice';
