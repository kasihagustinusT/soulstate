import { test, expect } from "vitest";
import { createStore } from "../src/core/store";

test("Stress Test: 1000 concurrent updates and 1000 subscribers", async () => {
  const store = createStore({ count: 0 });
  const listenerCount = 1000;
  const updateCount = 1000;

  let totalCalls = 0;
  for (let i = 0; i < listenerCount; i++) {
    store.subscribe(
      (s) => s.count,
      () => {
        totalCalls++;
      },
    );
  }

  for (let i = 0; i < updateCount; i++) {
    store.setState({ count: i + 1 });
  }

  // Wait for batching
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(store.getState().count).toBe(updateCount);
  // With batching, it should only be called once per listener
  expect(totalCalls).toBe(listenerCount);
});

test("Stress Test: Deeply nested state updates", () => {
  const store = createStore({
    a: { b: { c: { d: 1 } } },
    other: 0,
  });

  store.subscribe(
    (s) => s.a.b.c.d,
    (val) => {
      expect(val).toBe(2);
    },
  );

  store.setState((s) => ({
    a: { ...s.a, b: { ...s.a.b, c: { ...s.a.b.c, d: 2 } } },
  }));
});
