import { test, expect } from "vitest";
import { createStore as createSoulState } from "../src/core/store";
import { create as createZustand } from "zustand";

test("Memory Growth Stress Test (100,000 updates)", async () => {
  const runTest = (name: string, store: any, updateFn: (s: any) => void) => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    for (let i = 0; i < 100000; i++) {
      updateFn(store);
    }

    const endMemory = process.memoryUsage().heapUsed;
    const duration = performance.now() - startTime;
    const growth = (endMemory - startMemory) / 1024 / 1024;

    console.log(
      `${name}: ${duration.toFixed(2)}ms, Heap Growth: ${growth.toFixed(2)}MB`,
    );
    return growth;
  };

  const soulStore = createSoulState({ a: 1 });
  const runAsyncTest = async (name: string, store: any) => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    for (let i = 0; i < 100000; i++) {
      store.setState({ a: Math.random() });
      if (i % 100 === 0) await Promise.resolve(); // Flush every 100 updates
    }

    const endMemory = process.memoryUsage().heapUsed;
    const duration = performance.now() - startTime;
    console.log(
      `${name}: ${duration.toFixed(2)}ms, Heap Growth: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`,
    );
  };

  await runAsyncTest("SoulState (async/batched)", soulStore);

  const soulStoreSync = createSoulState({ a: 1 });
  runTest("SoulState (sync)", soulStoreSync, (s) =>
    s.setState({ a: Math.random() }, false, true),
  );

  const zustandStore = createZustand(() => ({ a: 1 }));
  runTest("Zustand", zustandStore, (s) => s.setState({ a: Math.random() }));
});
