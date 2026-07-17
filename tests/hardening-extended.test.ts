import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Hardening: stale dependency cleanup in computed", async () => {
  const store = createStore({ condition: true, a: 1, b: 2 });
  const comp = store.computed((s) => (s.condition ? s.a : s.b));

  expect(comp.value).toBe(1);

  store.setState({ condition: false });
  await Promise.resolve();
  expect(comp.value).toBe(2);
});

test("Hardening: detect infinite propagation loops", async () => {
  const store = createStore({ a: 1 });

  store.subscribe(
    (s) => s.a,
    (a) => {
      store.setState({ a: a + 1 }, false, true);
    },
  );

  // The error is thrown synchronously from processUpdate when MAX_FLUSH_DEPTH is hit
  expect(() => store.setState({ a: 2 }, false, true)).toThrow(
    /Potential infinite propagation cycle/,
  );
});
