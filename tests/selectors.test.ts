import { test, expect } from "vitest";
import { createStore } from "../src/core/store";
import { selector, derived } from "../src/core/selectors";

test("Selectors: selector() should be an identity function for type inference", () => {
  const s = selector((state: { a: number }) => state.a);
  expect(typeof s).toBe("function");
  expect(s({ a: 1 })).toBe(1);
});

test("Selectors: derived() should compose multiple selectors", () => {
  const store = createStore({ a: 1, b: 2 });
  const aSelector = (s: any) => s.a;
  const bSelector = (s: any) => s.b;
  const sum = derived(aSelector, bSelector, (a, b) => a + b);

  expect(sum(store.getState())).toBe(3);
});

test("Selectors: derived() should compose multiple computed values", async () => {
  const store = createStore({ a: 1, b: 2 });
  const aComp = store.computed((s) => s.a);
  const bComp = store.computed((s) => s.b);
  const sum = derived(aComp, bComp, (a, b) => a + b);

  expect(sum(store.getState())).toBe(3);

  store.setState({ a: 10 });
  await Promise.resolve();

  expect(sum(store.getState())).toBe(12);
});

test("Selectors: complex composition", async () => {
  const store = createStore({ items: [1, 2, 3], filter: 1 });

  const items = (s: any) => s.items;
  const filter = (s: any) => s.filter;

  const filtered = derived(items, (its) => its.filter((i: number) => i > 0));
  const result = store.computed((s) => {
    const f = filter(s);
    return filtered(s).map((i: number) => i + f);
  });

  expect(result.value).toEqual([2, 3, 4]);

  store.setState({ filter: 2 });
  await Promise.resolve();

  expect(result.value).toEqual([3, 4, 5]);
});
