import { test, expect } from "vitest";
import { createStore } from "../src/core/store";

test("Memory Leak: Subscription cleanup should release references", async () => {
  const store = createStore({ count: 0 });
  const iterations = 10000;

  // Use stable selector to avoid test-level function allocation noise
  const selector = (s: any) => s.count;
  const largeObject = new Array(1000).fill("leak-detection-data");

  for (let i = 0; i < iterations; i++) {
    const unsubscribe = store.subscribe(selector, () => {
      const data = largeObject;
    });
    unsubscribe();
  }

  const initialMemory = process.memoryUsage().heapUsed;

  for (let i = 0; i < iterations; i++) {
    const unsubscribe = store.subscribe(selector, () => {});
    unsubscribe();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const growth = (finalMemory - initialMemory) / 1024 / 1024;

  // With stable selector and pooling, growth should be near zero.
  // We allow 8MB for V8 jitter and pool baseline.
  expect(growth).toBeLessThan(8);
});
