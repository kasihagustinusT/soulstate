import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Dynamic Tracking: should update dependencies when selector branching changes", async () => {
  const store = createStore({
    useA: true,
    a: 1,
    b: 10,
  });

  const listener = vi.fn();

  // Subscriber depends on 'useA' and either 'a' or 'b'
  store.subscribe((s) => (s.useA ? s.a : s.b), listener);

  // Initially depends on useA and a
  store.setState({ a: 2 });
  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(2, 1);
  listener.mockClear();

  // Update b - should NOT trigger listener because we are currently using a
  store.setState({ b: 11 });
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();

  // Change branch to b
  store.setState({ useA: false });
  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(11, 2);
  listener.mockClear();

  // Now it should depend on useA and b. Update a - should NOT trigger listener.
  store.setState({ a: 3 });
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();

  // Update b - SHOULD trigger listener
  store.setState({ b: 12 });
  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(12, 11);
});
