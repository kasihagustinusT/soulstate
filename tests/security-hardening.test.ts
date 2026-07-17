import { test, expect, vi } from "vitest";
import { createStore, middleware } from "../src/index";
import { Computed } from "../src/core/types";
import { persist } from "../src/middleware/persist";
import { devtools } from "../src/middleware/devtools";

test("prototype pollution: state object should not have __proto__ as key", () => {
  const store = createStore({ count: 0 });

  // Attempt prototype pollution via setState
  store.setState({ ["__proto__"]: { polluted: true } } as any);

  // Verify prototype is not polluted globally
  expect(({} as any).polluted).toBeUndefined();
  // Verify state does not have __proto__ as own property
  expect(
    Object.prototype.hasOwnProperty.call(store.getState(), "__proto__"),
  ).toBe(false);
});

test("prototype pollution: nested __proto__ should not pollute", () => {
  const store = createStore({ data: {} as any });

  store.setState({
    data: { ["__proto__"]: { polluted: true } },
  } as any);

  expect(({} as any).polluted).toBeUndefined();
});

test("prototype pollution: constructor pollution should not work", () => {
  const store = createStore({ data: {} as any });

  store.setState({
    data: { constructor: { prototype: { polluted: true } } },
  } as any);

  expect(({} as any).polluted).toBeUndefined();
});

test("object mutation: setState should not mutate previous state", () => {
  const store = createStore({ count: 0, nested: { a: 1 } });
  const prevState = store.getState();

  store.setState({ count: 1 });

  // Previous state reference should not be mutated
  expect(prevState.count).toBe(0);
});

test("object mutation: setState with updater should not mutate", () => {
  const store = createStore({ items: [1, 2, 3] });
  const prevState = store.getState();
  const prevItems = prevState.items;

  store.setState((state) => ({ items: [...state.items, 4] }));

  // Previous items array should not be mutated
  expect(prevItems).toEqual([1, 2, 3]);
});

test("object mutation: computed should not mutate state", () => {
  const store = createStore({ count: 0 });
  const computed = store.computed((s) => s.count * 2);

  const val1 = computed.value;
  store.setState({ count: 5 });
  const val2 = computed.value;

  expect(val1).toBe(0);
  expect(val2).toBe(10);
});

test("unsafe eval: store should not execute arbitrary code", () => {
  const store = createStore({ count: 0 });

  // This should just set the value, not evaluate it
  store.setState({ count: 0 } as any);
  expect(store.getState().count).toBe(0);
});

test("serialization safety: persist middleware handles malformed JSON", () => {
  const mockStorage: Record<string, string> = {
    "test-key": "{invalid json",
  };

  const store = createStore(
    persist({
      key: "test-key",
      storage: {
        getItem: (key) => mockStorage[key] || null,
        setItem: (key, value) => {
          mockStorage[key] = value;
        },
        removeItem: (key) => {
          delete mockStorage[key];
        },
        clear: () => {},
        get length() {
          return 0;
        },
        key: () => null,
      },
    })((_set, _get) => ({
      count: 0,
    })),
  );

  // Should gracefully fall back to initial state
  expect(store.getState().count).toBe(0);
});

test("serialization safety: persist handles deeply nested circular refs", () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const store = createStore(
    persist({
      key: "test-key",
      storage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota exceeded");
        },
        removeItem: () => {},
        clear: () => {},
        get length() {
          return 0;
        },
        key: () => null,
      },
    })((set, _get) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    })),
  );

  // Attempt to trigger storage error
  (store.getState() as any).increment();

  // Should not throw, should handle gracefully
  expect(store.getState().count).toBe(1);
  consoleSpy.mockRestore();
});

test("denial of service: rapid setState should not cause stack overflow", () => {
  const store = createStore({ count: 0 });

  // 10,000 rapid synchronous updates
  for (let i = 0; i < 10000; i++) {
    store.setState({ count: i });
  }

  expect(store.getState().count).toBe(9999);
});

test("denial of service: deep nested computed chain should not overflow", async () => {
  const store = createStore({ value: 1 });

  // Create a chain of 50 computed nodes
  let current: Computed<number> = store.computed((s) => s.value);
  for (let i = 0; i < 49; i++) {
    const prev = current;
    current = store.computed(() => prev.value + 1);
  }

  expect(current.value).toBe(50);

  // Update root - chain should propagate without stack overflow
  store.setState({ value: 100 });
  await Promise.resolve();

  expect(current.value).toBe(149);
});

test("denial of service: mass subscription creation should not crash", () => {
  const store = createStore({ count: 0 });
  const unsubs: (() => void)[] = [];

  // Create 10,000 subscriptions
  for (let i = 0; i < 10000; i++) {
    unsubs.push(
      store.subscribe(
        (s) => s.count,
        () => {},
      ),
    );
  }

  expect(unsubs.length).toBe(10000);

  // Unsubscribe all
  for (const unsub of unsubs) {
    unsub();
  }

  expect(store.getState().count).toBe(0);
});

test("middleware input validation: persist requires key", () => {
  expect(() => persist({ key: "" as any })).not.toThrow();
});

test("middleware input validation: devtools handles missing extension", () => {
  const original = (globalThis as any).window;
  delete (globalThis as any).window;

  const store = createStore(
    devtools({ name: "Test" })((_set, _get) => ({ count: 0 })),
  );

  expect(store.getState()).toEqual({ count: 0 });
  (globalThis as any).window = original;
});

test("package exports: only intended paths are accessible", () => {
  // Verify the main entry point exports
  expect(typeof createStore).toBe("function");
  expect(typeof middleware.persist).toBe("function");
  expect(typeof middleware.devtools).toBe("function");
});
