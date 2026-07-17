import { test, expect } from "vitest";
import { createStore } from "../src/core/store";

test("createStore: throws on null creator", () => {
  expect(() => (createStore as any)(null)).toThrow("[SoulState]");
});

test("createStore: throws on undefined creator", () => {
  expect(() => (createStore as any)(undefined)).toThrow("[SoulState]");
});

test("setState: throws on destroyed store", () => {
  const store = createStore({ count: 0 });
  store.destroy();
  expect(() => store.setState({ count: 1 })).toThrow("[SoulState]");
});

test("setState: throws on null updater", () => {
  const store = createStore({ count: 0 });
  expect(() => (store.setState as any)(null)).toThrow("[SoulState]");
});

test("setState: throws on undefined updater", () => {
  const store = createStore({ count: 0 });
  expect(() => (store.setState as any)(undefined)).toThrow("[SoulState]");
});

test("subscribe: throws on destroyed store", () => {
  const store = createStore({ count: 0 });
  store.destroy();
  expect(() =>
    store.subscribe(
      (s) => s.count,
      () => {},
    ),
  ).toThrow("[SoulState]");
});

test("subscribe: throws on non-function selector", () => {
  const store = createStore({ count: 0 });
  expect(() => (store.subscribe as any)(null, () => {})).toThrow("[SoulState]");
});

test("subscribe: throws on non-function listener", () => {
  const store = createStore({ count: 0 });
  expect(() => store.subscribe((s) => s.count, null as any)).toThrow(
    "[SoulState]",
  );
});

test("computed: throws on destroyed store", () => {
  const store = createStore({ count: 0 });
  store.destroy();
  expect(() => store.computed((s) => s.count * 2)).toThrow("[SoulState]");
});

test("computed: throws with no arguments", () => {
  const store = createStore({ count: 0 });
  expect(() => (store.computed as any)()).toThrow("[SoulState]");
});

test("beginTransaction: throws on destroyed store", () => {
  const store = createStore({ count: 0 });
  store.destroy();
  expect(() => store.beginTransaction()).toThrow("[SoulState]");
});

test("getState: warns on destroyed store", () => {
  const store = createStore({ count: 0 });
  store.destroy();
  const warnSpy = console.warn;
  const warnings: string[] = [];
  console.warn = (...args: any[]) => warnings.push(args.join(" "));
  store.getState();
  console.warn = warnSpy;
  expect(warnings.some((w) => w.includes("destroyed"))).toBe(true);
});
