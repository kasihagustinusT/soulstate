import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Fast Path - No Granular Listeners (1,000 global subscribers)', () => {
  const soulStore = createSoulState({ a: 1 });
  for (let i = 0; i < 1000; i++) {
    // Global subscription (no selector)
    soulStore.subscribe(s => s, () => {});
  }

  const zustandStore = createZustand(() => ({ a: 1 }));
  for (let i = 0; i < 1000; i++) {
    zustandStore.subscribe(() => {});
  }

  bench('SoulState (fast path)', async () => {
    soulStore.setState({ a: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand (global)', () => {
    zustandStore.setState({ a: Math.random() });
  });
});
