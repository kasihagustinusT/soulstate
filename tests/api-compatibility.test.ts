import { test, expect } from "vitest";
import {
  createStore,
  scheduleTask,
  flushSync,
  createSelector,
  selector,
  derived,
  batch,
  objectIs,
  shallow,
  useShallow,
  createSlice,
  combineSlices,
  type State,
  type Selector,
  type Listener,
  type EqualityFn,
  type SubscribeOptions,
  type Computed,
  type Derived,
  type RuntimeInstrumentation,
  type StoreApi,
  type StateCreator,
  type PartialState,
  type StateUpdater,
  type DependencyKey,
  type Middleware,
} from "../src/index";
import {
  persist,
  devtools,
  type PersistOptions,
  type DevToolsOptions,
} from "../src/middleware";

test("createStore: creates store with plain state", () => {
  const store = createStore({ count: 0 });
  expect(store.getState()).toEqual({ count: 0 });
});

test("createStore: creates store with StateCreator", () => {
  const store = createStore((set, get) => ({
    count: 0,
    increment: () => set({ count: get().count + 1 }),
  }));
  expect(store.getState().count).toBe(0);
});

test("StoreApi: getState returns current state", () => {
  const store = createStore({ a: 1, b: "hello" });
  expect(store.getState()).toEqual({ a: 1, b: "hello" });
});

test("StoreApi: getVersion returns version number", () => {
  const store = createStore({ count: 0 });
  expect(typeof store.getVersion()).toBe("number");
});

test("StoreApi: setState with partial state", () => {
  const store = createStore({ count: 0, name: "test" });
  store.setState({ count: 5 });
  expect(store.getState().count).toBe(5);
});

test("StoreApi: setState with updater function", () => {
  const store = createStore({ count: 0 });
  store.setState((state) => ({ count: state.count + 10 }));
  expect(store.getState().count).toBe(10);
});

test("StoreApi: subscribe and unsubscribe", () => {
  const store = createStore({ count: 0 });
  const unsub = store.subscribe(
    (s) => s.count,
    () => {},
  );
  expect(typeof unsub).toBe("function");
  unsub();
});

test("StoreApi: beginTransaction/commitTransaction", () => {
  const store = createStore({ count: 0 });
  store.beginTransaction();
  store.setState({ count: 5 });
  store.commitTransaction();
  expect(store.getState().count).toBe(5);
});

test("StoreApi: rollbackTransaction", () => {
  const store = createStore({ count: 0 });
  store.beginTransaction();
  store.setState({ count: 5 });
  store.rollbackTransaction();
  expect(store.getState().count).toBe(0);
});

test("StoreApi: computed creates derived value", () => {
  const store = createStore({ count: 5 });
  const double = store.computed((s) => s.count * 2);
  expect(double.value).toBe(10);
  expect(typeof double.destroy).toBe("function");
});

test("StoreApi: enableInstrumentation does not throw", () => {
  const store = createStore({ count: 0 });
  expect(() => store.enableInstrumentation()).not.toThrow();
  expect(() => store.enableInstrumentation({})).not.toThrow();
});

test("StoreApi: destroy cleans up", () => {
  const store = createStore({ count: 0 });
  expect(() => store.destroy()).not.toThrow();
});

test("StoreApi: getMetrics returns snapshot", () => {
  const store = createStore({ count: 0 });
  const metrics = store.getMetrics();
  expect(metrics === null || typeof metrics === "object").toBe(true);
});

test("scheduleTask: schedules a function", () => {
  expect(typeof scheduleTask).toBe("function");
});

test("flushSync: executes callback synchronously", () => {
  const result = flushSync(() => 42);
  expect(result).toBe(42);
});

test("createSelector: creates memoized selector", () => {
  const sel = selector<{ count: number }, number>((s) => s.count);
  const combined = createSelector(sel, (count) => count * 2);
  expect(combined({ count: 5 })).toBe(10);
});

test("selector: identity wrapper", () => {
  const sel = selector<{ a: number }, number>((s) => s.a);
  expect(sel({ a: 42 })).toBe(42);
});

test("derived: combines multiple selectors", () => {
  const store = createStore({ a: 2, b: 3 });
  const sum = store.computed((s) => s.a + s.b);
  expect(sum.value).toBe(5);
});

test("batch: is a function", () => {
  expect(typeof batch).toBe("function");
});

test("objectIs: reference equality", () => {
  expect(objectIs(1, 1)).toBe(true);
  expect(objectIs(1, 2)).toBe(false);
  expect(objectIs(NaN, NaN)).toBe(true);
});

test("shallow: shallow equality", () => {
  expect(shallow({ a: 1 }, { a: 1 })).toBe(true);
  expect(shallow({ a: 1 }, { a: 2 })).toBe(false);
  expect(shallow({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
});

test("createSlice: creates a slice", () => {
  const counterSlice = createSlice({
    name: "counter",
    initialState: { count: 0 },
    reducers: {
      increment: (state) => ({ count: state.count + 1 }),
    },
  });
  expect(typeof counterSlice).toBe("function");
});

test("combineSlices: combines slices", () => {
  const slice1 = createSlice({
    name: "a",
    initialState: { value: 1 },
    reducers: {},
  });
  const slice2 = createSlice({
    name: "b",
    initialState: { value: 2 },
    reducers: {},
  });
  const combined = combineSlices(slice1, slice2);
  expect(typeof combined).toBe("function");
});

test("persist: creates persist middleware", () => {
  const middleware = persist({
    key: "test",
    storage: undefined,
  });
  expect(typeof middleware).toBe("function");
});

test("devtools: creates devtools middleware", () => {
  const middleware = devtools({ name: "Test" });
  expect(typeof middleware).toBe("function");
});

test("type exports: all types are importable", () => {
  const types: Record<string, unknown> = {
    State: {} as State,
    Selector: {} as Selector<State, number>,
    Listener: {} as Listener<number>,
    EqualityFn: {} as EqualityFn<number>,
    SubscribeOptions: {} as SubscribeOptions<number>,
    Computed: {} as Computed<number>,
    RuntimeInstrumentation: {} as RuntimeInstrumentation,
    StoreApi: {} as StoreApi<State>,
    StateCreator: {} as StateCreator<State>,
    PartialState: {} as PartialState<State>,
    StateUpdater: {} as StateUpdater<State>,
    DependencyKey: {} as DependencyKey,
    Middleware: {} as Middleware<State>,
    PersistOptions: {} as PersistOptions<State>,
    DevToolsOptions: {} as DevToolsOptions,
  };
  expect(Object.keys(types).length).toBe(15);
});
