import { State, PartialState } from "../core/types";

/**
 * Slice Options
 */
export interface SliceOptions<
  TState extends State,
  TName extends string,
  TReducers extends Record<
    string,
    (state: TState, ...args: any[]) => TState | Partial<TState>
  >,
> {
  /**
   * Unique name for the slice. This will be the key in the root store.
   */
  name: TName;
  /**
   * Initial state for the slice.
   */
  initialState: TState;
  /**
   * Reducers that update the slice state.
   */
  reducers: TReducers;
}

/**
 * Creates a slice of the store state with its own actions.
 * @param options Slice configuration.
 * @returns A state creator function that can be used with createStore or combined with other slices.
 */
export function createSlice<
  TState extends State,
  TName extends string,
  TReducers extends Record<
    string,
    (state: TState, ...args: any[]) => TState | Partial<TState>
  >,
>(options: SliceOptions<TState, TName, TReducers>) {
  const { name, initialState, reducers } = options;

  return (set: any, _get: any, _api: any) => {
    const actions = {} as any;

    Object.keys(reducers).forEach((key) => {
      actions[key] = (...args: any[]) => {
        set((state: any) => {
          const currentSliceState = state[name] || initialState;
          const result = reducers[key](currentSliceState, ...args);

          // If the reducer returns a full state or a partial state, merge it
          return {
            ...state,
            [name]: {
              ...currentSliceState,
              ...result,
              ...actions, // Re-inject actions to ensure they are available in the state
            },
          };
        });
      };
    });

    return {
      [name]: {
        ...initialState,
        ...actions,
      },
    };
  };
}

/**
 * Combines multiple slices into a single state creator.
 * @param slices Array of slice creators.
 * @returns A single state creator function.
 */
export function combineSlices(
  ...slices: Array<(set: any, get: any, api: any) => any>
) {
  return (set: any, get: any, api: any) => {
    return slices.reduce((acc, slice) => {
      const result = slice(set, get, api);
      return Object.assign(acc, result);
    }, {});
  };
}
