import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Computed: should compute lazy value and cache it", () => {
  const store = createStore({ a: 1, b: 2 });
  const selector = vi.fn((s: any) => s.a + s.b);
  const sum = store.computed(selector);

  expect(selector).not.toHaveBeenCalled();

  expect(sum.value).toBe(3);
  expect(selector).toHaveBeenCalledTimes(1);

  expect(sum.value).toBe(3);
  expect(selector).toHaveBeenCalledTimes(1); // Cached
});

test("Computed: should recompute when dependencies change", async () => {
  const store = createStore({ a: 1, b: 2 });
  const sum = store.computed((s) => s.a + s.b);

  expect(sum.value).toBe(3);

  store.setState({ a: 2 });

  // Need to wait for microtask to finish invalidation cycle in Runtime
  await Promise.resolve();

  expect(sum.value).toBe(4);
});

test("Computed: should trigger subscriptions when computed value changes", async () => {
  const store = createStore({ a: 1, b: 2 });
  const sum = store.computed((s) => s.a + s.b, "sum");
  const listener = vi.fn();

  // We must subscribe to the store state to trigger the dependency tracking
  store.subscribe((s) => sum.value, listener);

  store.setState({ a: 2 });

  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(4, 3);
});

test("Computed: should not trigger subscriptions if computed value is same", async () => {
  const store = createStore({ a: 1, b: 2, c: 0 });
  const isPositive = store.computed((s) => s.a > 0, "isPositive");
  const listener = vi.fn();

  store.subscribe((s) => isPositive.value, listener);

  store.setState({ a: 2 }); // Still positive

  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();
});
