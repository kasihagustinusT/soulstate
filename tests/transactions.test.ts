import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Transactions: should batch updates and only notify on commit", async () => {
  const store = createStore({ count: 0, text: "" });
  const listener = vi.fn();

  store.subscribe((s) => s.count, listener);

  store.beginTransaction();
  store.setState({ count: 1 });
  store.setState({ count: 2 });
  store.setState({ text: "hello" });

  // No notifications yet
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();

  store.commitTransaction();

  // Wait for batching
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(2, 0);
  expect(store.getState()).toEqual({ count: 2, text: "hello" });
});

test("Transactions: should rollback updates", async () => {
  const store = createStore({ count: 0 });
  const listener = vi.fn();

  store.subscribe((s) => s.count, listener);

  store.beginTransaction();
  store.setState({ count: 1 });
  store.rollbackTransaction();

  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();
  expect(store.getState().count).toBe(0);
});

test("Transactions: getState should return buffered state during transaction", () => {
  const store = createStore({ count: 0 });

  store.beginTransaction();
  store.setState({ count: 1 });
  expect(store.getState().count).toBe(1);
  store.rollbackTransaction();
  expect(store.getState().count).toBe(0);
});
