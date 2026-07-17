import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Stress: handle 10,000 subscribers with surgical updates", async () => {
  const store = createStore({ a: 0, b: 0 });
  let aCalled = 0;
  let bCalled = 0;
  const aListeners = Array.from({ length: 5000 }, () => () => {
    aCalled++;
  });
  const bListeners = Array.from({ length: 5000 }, () => () => {
    bCalled++;
  });

  aListeners.forEach((l) => store.subscribe((s) => (s as any).a, l));
  bListeners.forEach((l) => store.subscribe((s) => (s as any).b, l));

  const startTime = performance.now();
  store.setState({ a: 1 });
  await Promise.resolve();
  const duration = performance.now() - startTime;

  console.log(
    `Propagation to 5,000 surgical listeners took ${duration.toFixed(2)}ms`,
  );

  expect(aCalled).toBe(5000);
  expect(bCalled).toBe(0);

  expect(duration).toBeLessThan(100);
});

test("Stress: deep computed chains", async () => {
  const store = createStore({ count: 1 });
  let lastComputed = store.computed((s: any) => s.count);

  for (let i = 0; i < 50; i++) {
    const prev = lastComputed;
    lastComputed = store.computed(() => prev.value + 1);
  }

  expect(lastComputed.value).toBe(51);

  store.setState({ count: 2 });
  await Promise.resolve();

  expect(lastComputed.value).toBe(52);
});

test("Stress: high churn of subscriptions", async () => {
  const store = createStore({ a: 1 });
  const listeners = Array.from({ length: 1000 }, () => vi.fn());

  for (let i = 0; i < 10; i++) {
    const unsubs = listeners.map((l) => store.subscribe((s) => s.a, l));
    store.setState({ a: i + 2 });
    await Promise.resolve();
    unsubs.forEach((unsub) => unsub());
  }

  listeners.forEach((l) => expect(l).toHaveBeenCalledTimes(10));
});

test("Stress: 1000 rapid synchronous setState calls", () => {
  const store = createStore({ count: 0 });

  for (let i = 0; i < 1000; i++) {
    store.setState({ count: i + 1 });
  }

  expect(store.getState().count).toBe(1000);
});

test("Stress: many computed nodes with shared dependencies", async () => {
  const store = createStore({ x: 1, y: 2 });
  const computeds = Array.from({ length: 100 }, (_, i) => {
    return store.computed((s: any) => s.x * (i + 1) + s.y);
  });

  expect(computeds[0].value).toBe(3);
  expect(computeds[99].value).toBe(102);

  store.setState({ x: 10 });
  await Promise.resolve();

  expect(computeds[0].value).toBe(12);
  expect(computeds[99].value).toBe(1002);
});

test("Stress: rapid subscribe/unsubscribe cycling", async () => {
  const store = createStore({ value: 0 });
  const calls: number[] = [];

  for (let i = 0; i < 500; i++) {
    const unsub = store.subscribe(
      (s) => s.value,
      (v) => calls.push(v),
    );
    store.setState({ value: i + 1 });
    await Promise.resolve();
    unsub();
  }

  expect(calls.length).toBe(500);
  expect(calls[calls.length - 1]).toBe(500);
});

test("Stress: wide fan-out with 5000 computed nodes", () => {
  const store = createStore({ base: 1 });
  const computeds = Array.from({ length: 5000 }, (_, i) => {
    return store.computed((s: any) => s.base * 2 + i);
  });

  expect(computeds[0].value).toBe(2);
  expect(computeds[4999].value).toBe(5001);

  store.setState({ base: 100 });

  expect(computeds[0].value).toBe(200);
  expect(computeds[4999].value).toBe(5199);
});

test("Stress: destroy and verify cleanup under load", () => {
  const store = createStore({ count: 0 });
  const calls: number[] = [];

  for (let i = 0; i < 100; i++) {
    store.subscribe(
      (s) => s.count,
      (v) => calls.push(v),
    );
  }

  store.destroy();

  expect(() => store.setState({ count: 1 })).toThrow("[SoulState]");
  expect(() => store.computed((s) => s.count)).toThrow("[SoulState]");
  expect(calls).toEqual([]);
});
