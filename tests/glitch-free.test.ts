import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Glitch-free: computed values should only re-evaluate once per batch", async () => {
  const store = createStore({ a: 1 });
  const runLog: string[] = [];

  const b = store.computed((s) => {
    runLog.push("b");
    return s.a + 1;
  });

  const c = store.computed((s) => {
    runLog.push("c");
    return s.a + 1;
  });

  const d = store.computed(b, c, (valB, valC) => {
    runLog.push("d");
    return valB + valC;
  });

  // Initial run
  expect(d.value).toBe(4);
  expect(runLog).toEqual(["b", "c", "d"]);
  runLog.length = 0;

  // Update 'a'
  store.setState({ a: 2 });

  // d.value should trigger re-evaluation of b, c, and then d itself
  // but they should be topologically sorted.
  // In SoulState, computed are lazy but the propagation engine invalidates them.

  expect(d.value).toBe(6);

  // Verify topological ordering: b and c can be in any order, but d must be last.
  // Actually, since d is accessed, it triggers b and c.
  expect(runLog[runLog.length - 1]).toBe("d");
  expect(new Set(runLog.slice(0, 2))).toEqual(new Set(["b", "c"]));
});

test("Glitch-free: diamond dependency should not cause multiple executions", async () => {
  const store = createStore({ a: 1 });
  let dExecCount = 0;

  const b = store.computed((s) => s.a + 1);
  const c = store.computed((s) => s.a + 1);

  const listener = vi.fn();
  store.subscribe((s) => {
    dExecCount++;
    return b.value + c.value;
  }, listener);

  // Initial subscriber run (during subscribe)
  expect(listener).not.toHaveBeenCalled();
  expect(dExecCount).toBe(1);

  // Update a
  store.setState({ a: 2 });
  await Promise.resolve();

  // listener should be called exactly once
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(6, 4);
  // dExecCount might be more than 1 if it's not perfectly optimized,
  // but glitch-free means the listener only sees the FINAL consistent state.
  expect(dExecCount).toBe(2);
});
