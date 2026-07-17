import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Concurrent: should handle multiple setState calls in the same microtask", async () => {
  const store = createStore({ count: 0 });
  const listener = vi.fn();
  store.subscribe((s) => s.count, listener);

  store.setState({ count: 1 });
  store.setState({ count: 2 });
  store.setState({ count: 3 });

  await Promise.resolve();

  expect(store.getState().count).toBe(3);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(3, 0);
});

test("Concurrent: should handle interleaved async updates", async () => {
  const store = createStore({ count: 0 });
  const listener = vi.fn();
  store.subscribe((s) => s.count, listener);

  const update = async (val: number) => {
    await Promise.resolve();
    store.setState({ count: val });
  };

  update(1);
  update(2);

  await Promise.resolve(); // For the update() call
  await Promise.resolve(); // For the store's scheduleTask

  expect(store.getState().count).toBe(2);
  // Might be called once or twice depending on timing, but should be stable.
  expect(listener.mock.calls.length).toBeLessThanOrEqual(2);
});

test("Concurrent: should handle nested updates during listener execution", async () => {
  const store = createStore({ a: 1, b: 0 });

  store.subscribe(
    (s) => s.a,
    (a) => {
      store.setState({ b: a * 2 });
    },
  );

  const bListener = vi.fn();
  store.subscribe((s) => s.b, bListener);

  store.setState({ a: 2 });

  await Promise.resolve(); // a's update
  await Promise.resolve(); // b's update (scheduled during a's listener)

  expect(store.getState().b).toBe(4);
  expect(bListener).toHaveBeenCalledWith(4, 0);
});
