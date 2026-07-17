import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Instrumentation: should call onFlush with performance metrics", async () => {
  const store = createStore({ count: 0 });
  const onFlush = vi.fn();

  store.enableInstrumentation({ onFlush });

  store.setState({ count: 1 });

  await Promise.resolve();

  expect(onFlush).toHaveBeenCalledTimes(1);
  const [duration, changedKeys] = onFlush.mock.calls[0];
  expect(typeof duration).toBe("number");
  expect(changedKeys.has("count")).toBe(true);
});

test("Instrumentation: should call onInvalidate when computed is dirtied", async () => {
  const store = createStore({ count: 0 });
  const onInvalidate = vi.fn();

  store.enableInstrumentation({ onInvalidate });

  const doubled = store.computed((s) => s.count * 2, "doubled");
  doubled.value; // Initialize

  store.setState({ count: 1 });

  await Promise.resolve();
  expect(onInvalidate).toHaveBeenCalledWith("doubled");
});
