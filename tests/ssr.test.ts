import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../src/core/store";

interface SSRState {
  count: number;
  name: string;
  items: string[];
}

describe("SSR", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test("should create store in non-browser environment", () => {
    // Simulate server environment
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 0,
      name: "test",
      items: [],
    });

    expect(store.getState()).toEqual({
      count: 0,
      name: "test",
      items: [],
    });
  });

  test("should update state synchronously in server environment", () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 0,
      name: "test",
      items: [],
    });

    store.setState({ count: 1 });
    expect(store.getState().count).toBe(1);

    store.setState((state) => ({ count: state.count + 1 }));
    expect(store.getState().count).toBe(2);
  });

  test("should serialize store state for client hydration", () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 42,
      name: "hydrated",
      items: ["a", "b", "c"],
    });

    const serialized = JSON.stringify(store.getState());
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual({
      count: 42,
      name: "hydrated",
      items: ["a", "b", "c"],
    });
  });

  test("should support computed values in server environment", () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 5,
      name: "test",
      items: [],
    });

    const doubleCount = store.computed((state) => state.count * 2);
    expect(doubleCount.value).toBe(10);

    store.setState({ count: 10 });
    expect(doubleCount.value).toBe(20);
  });

  test("should handle subscriptions in server environment", async () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 0,
      name: "test",
      items: [],
    });

    const listener = vi.fn();
    store.subscribe((state) => state.count, listener);

    store.setState({ count: 1 });
    await Promise.resolve();

    expect(listener).toHaveBeenCalledWith(1, 0);
  });

  test("should support transactions in server environment", () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 0,
      name: "test",
      items: [],
    });

    store.beginTransaction();
    store.setState({ count: 10 });
    store.setState({ name: "updated" });
    store.commitTransaction();

    expect(store.getState()).toEqual({
      count: 10,
      name: "updated",
      items: [],
    });
  });

  test("should handle multiple store instances in server environment", () => {
    delete (globalThis as any).window;

    const store1 = createStore({ count: 0 });
    const store2 = createStore({ count: 100 });

    store1.setState({ count: 1 });

    expect(store1.getState().count).toBe(1);
    expect(store2.getState().count).toBe(100);
  });

  test("should clean up subscriptions properly", async () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 0,
      name: "test",
      items: [],
    });

    const listener = vi.fn();
    const unsubscribe = store.subscribe((state) => state.count, listener);

    store.setState({ count: 1 });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    store.setState({ count: 2 });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("should support computed subscription in server environment", async () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 5,
      name: "test",
      items: [],
    });

    const doubleCount = store.computed((state) => state.count * 2);
    const listener = vi.fn();
    store.subscribe((state) => doubleCount.value, listener);

    store.setState({ count: 10 });
    await Promise.resolve();

    expect(listener).toHaveBeenCalledWith(20, 10);
  });

  test("should handle destroy in server environment", () => {
    delete (globalThis as any).window;

    const store = createStore<SSRState>({
      count: 0,
      name: "test",
      items: [],
    });

    store.destroy();

    // Store should still be accessible after destroy
    expect(store.getState()).toEqual({
      count: 0,
      name: "test",
      items: [],
    });
  });
});
