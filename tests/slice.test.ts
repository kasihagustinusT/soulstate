import { expect, test, vi } from "vitest";
import { createStore } from "../src/core/store";
import { createSlice, combineSlices } from "../src/utils/slice";

test("createSlice should create a slice with state and actions", () => {
  const userSlice = createSlice({
    name: "user",
    initialState: { name: "John", age: 30 },
    reducers: {
      setName: (state, name: string) => ({ ...state, name }),
      incrementAge: (state) => ({ ...state, age: state.age + 1 }),
    },
  });

  const store = createStore(userSlice) as any;

  expect(store.getState().user.name).toBe("John");
  expect(store.getState().user.age).toBe(30);

  store.getState().user.setName("Jane");
  expect(store.getState().user.name).toBe("Jane");

  store.getState().user.incrementAge();
  expect(store.getState().user.age).toBe(31);
});

test("combineSlices should combine multiple slices", () => {
  const userSlice = createSlice({
    name: "user",
    initialState: { name: "John" },
    reducers: {
      setName: (state, name: string) => ({ ...state, name }),
    },
  });

  const counterSlice = createSlice({
    name: "counter",
    initialState: { count: 0 },
    reducers: {
      increment: (state) => ({ ...state, count: state.count + 1 }),
    },
  });

  const store = createStore(combineSlices(userSlice, counterSlice)) as any;

  expect(store.getState().user.name).toBe("John");
  expect(store.getState().counter.count).toBe(0);

  store.getState().user.setName("Jane");
  store.getState().counter.increment();

  expect(store.getState().user.name).toBe("Jane");
  expect(store.getState().counter.count).toBe(1);
});

test("slices should support surgical updates", async () => {
  const userSlice = createSlice({
    name: "user",
    initialState: { name: "John", age: 30 },
    reducers: {
      setName: (state, name: string) => ({ ...state, name }),
      setAge: (state, age: number) => ({ ...state, age }),
    },
  });

  const store = createStore(userSlice) as any;
  const nameListener = vi.fn();
  const ageListener = vi.fn();

  store.subscribe((s: any) => s.user.name, nameListener);
  store.subscribe((s: any) => s.user.age, ageListener);

  store.getState().user.setName("Jane");
  await Promise.resolve();

  expect(nameListener).toHaveBeenCalledWith("Jane", "John");
  expect(ageListener).not.toHaveBeenCalled();

  store.getState().user.setAge(31);
  await Promise.resolve();

  expect(ageListener).toHaveBeenCalledWith(31, 30);
});
