import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Subscription Throughput (1,000 subscribers)', () => {
  bench('SoulState', () => {
    const store = createSoulState({ a: 1 });
    for (let i = 0; i < 1000; i++) {
      store.subscribe(s => s.a, () => {});
    }
  });

  bench('Zustand', () => {
    const useStore = createZustand(() => ({ a: 1 }));
    for (let i = 0; i < 1000; i++) {
      useStore.subscribe(() => {});
    }
  });
});

describe('Surgical Update Propagation (1,000 subscribers)', () => {
  const soulStore = createSoulState({ a: 1, b: 2 });
  for (let i = 0; i < 1000; i++) {
    soulStore.subscribe(s => s.a, () => {});
  }

  const zustandStore = createZustand(() => ({ a: 1, b: 2 }));
  for (let i = 0; i < 1000; i++) {
    zustandStore.subscribe(() => {});
  }

  bench('SoulState (surgical)', async () => {
    soulStore.setState({ a: Math.random() });
    await Promise.resolve(); // Wait for microtask
  });

  bench('Zustand (global)', async () => {
    zustandStore.setState({ a: Math.random() });
    // Zustand notifies synchronously
  });
});
