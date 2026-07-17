import { test, expect, vi } from "vitest";
import { createStore } from "../src/core/store";

test("Systems: 100,000 subscribers stress test", async () => {
  const store = createStore({ a: 0, b: 0 });
  let aCalled = 0;
  const count = 100000;

  for (let i = 0; i < count; i++) {
    store.subscribe(
      (s) => (s as any).a,
      () => {
        aCalled++;
      },
    );
  }

  const startTime = performance.now();
  store.setState({ a: 1 });
  await Promise.resolve();
  const duration = performance.now() - startTime;

  console.log(
    `Propagation to ${count} listeners took ${duration.toFixed(2)}ms`,
  );
  expect(aCalled).toBe(count);
  expect(duration).toBeLessThan(1000); // Should be reasonable
});

test("Systems: Sparse update elimination", async () => {
  const store = createStore({ a: 1, b: 2 });
  const aListener = vi.fn();
  const bListener = vi.fn();

  store.subscribe((s) => s.a, aListener);
  store.subscribe((s) => s.b, bListener);

  store.setState({ a: 2 });
  await Promise.resolve();

  expect(aListener).toHaveBeenCalledTimes(1);
  expect(bListener).not.toHaveBeenCalled();
});

test("Systems: Glitch-free propagation (diamond dependency)", async () => {
  // a -> b
  // a -> c
  // (b, c) -> d
  // d should only be recomputed ONCE when a changes

  const store = createStore({ a: 1 });
  const b = store.computed((s) => s.a + 1, "b");
  const c = store.computed((s) => s.a + 2, "c");

  const dSelector = vi.fn(() => b.value + c.value);
  const d = store.computed(dSelector, "d");

  expect(d.value).toBe(5); // 1+1 + 1+2
  expect(dSelector).toHaveBeenCalledTimes(1);

  store.setState({ a: 2 });
  await Promise.resolve();

  expect(d.value).toBe(7); // 2+1 + 2+2
  expect(dSelector).toHaveBeenCalledTimes(2); // Should not be 3!
});

test("Systems: Deterministic ordering", async () => {
  const store = createStore({ a: 1 });
  const order: string[] = [];

  store.subscribe(
    (s) => s.a,
    () => order.push("sub1"),
  );
  store.subscribe(
    (s) => s.a,
    () => order.push("sub2"),
  );

  store.setState({ a: 2 });
  await Promise.resolve();

  expect(order).toEqual(["sub1", "sub2"]);
});

test("Systems: Transaction rollback", async () => {
  const store = createStore({ a: 1 });
  const listener = vi.fn();
  store.subscribe((s) => s.a, listener);

  store.beginTransaction();
  store.setState({ a: 2 });
  store.rollbackTransaction();

  await Promise.resolve();
  expect(store.getState().a).toBe(1);
  expect(listener).not.toHaveBeenCalled();
});

test("Systems: No-op propagation", async () => {
  const store = createStore({ a: 1 });
  const listener = vi.fn();
  store.subscribe((s) => s.a, listener);

  store.setState({ a: 1 });
  await Promise.resolve();

  expect(listener).not.toHaveBeenCalled();
});

test("Systems: Dynamic dependency tracking", async () => {
  const store = createStore({ a: 1, b: 2, toggle: true });
  const selector = vi.fn((s: any) => (s.toggle ? s.a : s.b));
  const listener = vi.fn();

  store.subscribe(selector, listener);

  // Initially tracks 'toggle' and 'a'
  store.setState({ b: 3 });
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();

  store.setState({ toggle: false });
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(1);

  // Now should track 'toggle' and 'b'
  store.setState({ a: 10 });
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(1); // No increase

  store.setState({ b: 20 });
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(2);
});

test("Systems: Large graph propagation (1000 computed nodes)", async () => {
  const store = createStore({ val: 1 });
  let lastNode: any = store.computed((s) => s.val);

  for (let i = 0; i < 1000; i++) {
    const prev = lastNode;
    lastNode = store.computed(() => prev.value + 1);
  }

  expect(lastNode.value).toBe(1001);

  const startTime = performance.now();
  store.setState({ val: 2 });
  await Promise.resolve();
  const duration = performance.now() - startTime;

  console.log(`Propagation through 1000 nodes took ${duration.toFixed(2)}ms`);
  expect(lastNode.value).toBe(1002);
});
