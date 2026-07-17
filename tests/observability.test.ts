import { test, expect, vi } from "vitest";
import { createStore } from "../src/index";

test("getMetrics: returns initial zero metrics", () => {
  const store = createStore({ count: 0 });
  const metrics = store.getMetrics();

  expect(metrics.flushCount).toBe(0);
  expect(metrics.selectorRunCount).toBe(0);
  expect(metrics.invalidationCount).toBe(0);
  expect(metrics.averageFlushDuration).toBe(0);
  expect(metrics.totalFlushDuration).toBe(0);
  expect(metrics.lastFlushDuration).toBe(0);
});

test("getMetrics: tracks state updates after flush", async () => {
  const store = createStore({ count: 0 });
  store.enableInstrumentation({});

  store.setState({ count: 1 });
  await Promise.resolve();

  const metrics = store.getMetrics();
  expect(metrics.flushCount).toBeGreaterThanOrEqual(1);
});

test("getMetrics: tracks computed invalidations", async () => {
  const store = createStore({ count: 0 });
  store.enableInstrumentation({ onInvalidate: () => {} });
  const doubled = store.computed((s) => s.count * 2);
  doubled.value; // initialize to register in graph

  store.setState({ count: 5 });
  await Promise.resolve();

  const metrics = store.getMetrics();
  expect(metrics.invalidationCount).toBeGreaterThanOrEqual(1);
});

test("enableInstrumentation: onFlush receives duration and changed keys", async () => {
  const store = createStore({ count: 0 });
  const onFlush = vi.fn();

  store.enableInstrumentation({ onFlush });
  store.setState({ count: 5 });
  await Promise.resolve();

  expect(onFlush).toHaveBeenCalledTimes(1);
  const [duration, changedKeys] = onFlush.mock.calls[0];
  expect(typeof duration).toBe("number");
  expect(changedKeys.has("count")).toBe(true);
});

test("enableInstrumentation: onInvalidate called for computed deps", async () => {
  const store = createStore({ count: 0 });
  const onInvalidate = vi.fn();

  store.enableInstrumentation({ onInvalidate });
  const doubled = store.computed((s) => s.count * 2, "doubled");
  doubled.value; // Initialize

  store.setState({ count: 5 });
  await Promise.resolve();

  expect(onInvalidate).toHaveBeenCalled();
});

test("enableInstrumentation: no-op when no options provided", () => {
  const store = createStore({ count: 0 });

  store.enableInstrumentation();
  store.setState({ count: 1 });

  expect(store.getState().count).toBe(1);
});

test("subscriptions: listener is called on relevant changes", async () => {
  const store = createStore({ count: 0, name: "test" });
  const counts: number[] = [];

  store.subscribe(
    (s) => s.count,
    (count) => {
      counts.push(count);
    },
  );

  store.setState({ count: 1 });
  await Promise.resolve();
  store.setState({ name: "changed" });
  await Promise.resolve();
  store.setState({ count: 2 });
  await Promise.resolve();

  expect(counts).toEqual([1, 2]);
});

test("subscriptions: listener not called when value unchanged", async () => {
  const store = createStore({ count: 0, name: "test" });
  const counts: number[] = [];

  store.subscribe(
    (s) => s.count,
    (count) => {
      counts.push(count);
    },
  );

  store.setState({ name: "changed" });
  await Promise.resolve();
  store.setState({ name: "changed-again" });
  await Promise.resolve();

  expect(counts).toEqual([]);
});

test("subscriptions: equalityFn controls when listener fires", async () => {
  const store = createStore({ count: 0 });
  const calls: number[] = [];

  store.subscribe(
    (s) => s.count,
    (count) => calls.push(count),
    { equalityFn: () => true },
  );

  store.setState({ count: 1 });
  await Promise.resolve();
  store.setState({ count: 2 });
  await Promise.resolve();

  expect(calls).toEqual([]);
});

test("subscriptions: unsubscribe stops notifications", async () => {
  const store = createStore({ count: 0 });
  const calls: number[] = [];

  const unsub = store.subscribe(
    (s) => s.count,
    (count) => calls.push(count),
  );
  store.setState({ count: 1 });
  await Promise.resolve();

  unsub();
  store.setState({ count: 2 });
  await Promise.resolve();

  expect(calls).toEqual([1]);
});

test("computed: recomputes when dependencies change", () => {
  const store = createStore({ count: 0 });
  const computed = store.computed((s) => s.count * 2);

  expect(computed.value).toBe(0);

  store.setState({ count: 5 });
  expect(computed.value).toBe(10);
});

test("computed: holds reference tracks invalidation", () => {
  const store = createStore({ a: 1, b: 2 });
  const hold = store.computed((s) => s.a + s.b);

  expect(hold.value).toBe(3);

  store.setState({ a: 10 });
  expect(hold.value).toBe(12);
});

test("destroy: marks store as destroyed", () => {
  const store = createStore({ count: 0 });
  store.destroy();

  expect(() => store.setState({ count: 1 })).toThrow("[SoulState]");
  expect(() => store.computed((s) => s.count)).toThrow("[SoulState]");
  expect(() => store.beginTransaction()).toThrow("[SoulState]");
});

test("destroy: getState warns on destroyed store", () => {
  const store = createStore({ count: 0 });
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  store.destroy();
  store.getState();

  expect(warnSpy).toHaveBeenCalled();
  warnSpy.mockRestore();
});
