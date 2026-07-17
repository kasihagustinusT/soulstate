import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../src/core/store";

interface HydrationState {
  count: number;
  name: string;
  items: string[];
  nested: { a: number; b: number };
}

describe("Hydration", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test("should create store from serialized server state", () => {
    // Simulate server state
    const serverState: HydrationState = {
      count: 42,
      name: "hydrated",
      items: ["a", "b", "c"],
      nested: { a: 1, b: 2 },
    };

    // Create store with server state
    const store = createStore<HydrationState>(serverState);

    expect(store.getState()).toEqual(serverState);
  });

  test("should hydrate client store from server state", () => {
    // Server state
    const serverState: HydrationState = {
      count: 42,
      name: "hydrated",
      items: ["a", "b", "c"],
      nested: { a: 1, b: 2 },
    };

    // Client creates store with initial state
    const store = createStore<HydrationState>({
      count: 0,
      name: "",
      items: [],
      nested: { a: 0, b: 0 },
    });

    // Hydrate with server state
    store.setState(serverState);

    expect(store.getState()).toEqual(serverState);
  });

  test("should preserve computed values after hydration", () => {
    const serverState: HydrationState = {
      count: 21,
      name: "hydrated",
      items: ["a", "b"],
      nested: { a: 1, b: 2 },
    };

    const store = createStore<HydrationState>(serverState);

    const doubleCount = store.computed((state) => state.count * 2);
    const sum = store.computed((state) => state.nested.a + state.nested.b);

    expect(doubleCount.value).toBe(42);
    expect(sum.value).toBe(3);
  });

  test("should update computed values after hydration updates", async () => {
    const serverState: HydrationState = {
      count: 21,
      name: "hydrated",
      items: ["a", "b"],
      nested: { a: 1, b: 2 },
    };

    const store = createStore<HydrationState>(serverState);

    const doubleCount = store.computed((state) => state.count * 2);
    expect(doubleCount.value).toBe(42);

    store.setState({ count: 50 });
    await Promise.resolve();

    expect(doubleCount.value).toBe(100);
  });

  test("should handle partial hydration", () => {
    const initialState: HydrationState = {
      count: 0,
      name: "initial",
      items: [],
      nested: { a: 0, b: 0 },
    };

    const store = createStore<HydrationState>(initialState);

    // Partial hydration - only update some fields
    store.setState({ count: 42, name: "hydrated" });

    expect(store.getState().count).toBe(42);
    expect(store.getState().name).toBe("hydrated");
    expect(store.getState().items).toEqual([]);
    expect(store.getState().nested).toEqual({ a: 0, b: 0 });
  });

  test("should notify subscribers during hydration", async () => {
    const initialState: HydrationState = {
      count: 0,
      name: "initial",
      items: [],
      nested: { a: 0, b: 0 },
    };

    const store = createStore<HydrationState>(initialState);

    const listener = vi.fn();
    store.subscribe((state) => state.count, listener);

    // Hydrate
    store.setState({ count: 42 });
    await Promise.resolve();

    expect(listener).toHaveBeenCalledWith(42, 0);
  });

  test("should support subscription cleanup after hydration", async () => {
    const store = createStore<HydrationState>({
      count: 0,
      name: "",
      items: [],
      nested: { a: 0, b: 0 },
    });

    const listener = vi.fn();
    const unsubscribe = store.subscribe((state) => state.count, listener);

    // Hydrate
    store.setState({ count: 42 });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // Update after unsubscribe
    store.setState({ count: 100 });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("should handle hydration with transactions", () => {
    const store = createStore<HydrationState>({
      count: 0,
      name: "",
      items: [],
      nested: { a: 0, b: 0 },
    });

    // Hydrate using transaction for atomicity
    store.beginTransaction();
    store.setState({ count: 42 });
    store.setState({ name: "hydrated" });
    store.setState({ items: ["a", "b"] });
    store.commitTransaction();

    expect(store.getState()).toEqual({
      count: 42,
      name: "hydrated",
      items: ["a", "b"],
      nested: { a: 0, b: 0 },
    });
  });

  test("should handle hydration rollback", () => {
    const store = createStore<HydrationState>({
      count: 0,
      name: "initial",
      items: [],
      nested: { a: 0, b: 0 },
    });

    store.beginTransaction();
    store.setState({ count: 42 });
    store.setState({ name: "hydrated" });
    store.rollbackTransaction();

    expect(store.getState()).toEqual({
      count: 0,
      name: "initial",
      items: [],
      nested: { a: 0, b: 0 },
    });
  });

  test("should preserve state equality after hydration", () => {
    const serverState: HydrationState = {
      count: 42,
      name: "hydrated",
      items: ["a", "b", "c"],
      nested: { a: 1, b: 2 },
    };

    const store = createStore<HydrationState>(serverState);

    // Get state reference
    const stateRef = store.getState();

    // Hydrate with same state
    store.setState(serverState);

    // State should be equal but different reference (merge creates new object)
    expect(store.getState()).toEqual(serverState);
  });

  test("should handle hydration with computed dependencies", async () => {
    const store = createStore<HydrationState>({
      count: 0,
      name: "",
      items: [],
      nested: { a: 0, b: 0 },
    });

    const totalItems = store.computed((state) => state.items.length);
    const nestedSum = store.computed(
      (state) => state.nested.a + state.nested.b,
    );

    expect(totalItems.value).toBe(0);
    expect(nestedSum.value).toBe(0);

    // Hydrate
    store.setState({
      items: ["a", "b", "c"],
      nested: { a: 10, b: 20 },
    });
    await Promise.resolve();

    expect(totalItems.value).toBe(3);
    expect(nestedSum.value).toBe(30);
  });
});
