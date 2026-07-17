import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Stress Test (100,000 Subscribers)', () => {
  // Pre-setup stores to avoid measuring creation time in throughput tests
  const soulStore = createSoulState({ a: 1, b: 2 });
  const zustandStore = createZustand(() => ({ a: 1, b: 2 }));

  // Add 100k subscribers
  for (let i = 0; i < 100000; i++) {
    soulStore.subscribe(s => s.a, () => {});
    zustandStore.subscribe(() => {});
  }

  bench('SoulState: Update with 100k relevant subscribers', async () => {
    soulStore.setState({ a: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand: Update with 100k global subscribers', () => {
    zustandStore.setState({ a: Math.random() });
  });

  bench('SoulState: Update with 100k irrelevant subscribers (b)', async () => {
    // Only 'b' changed, and no one is subscribed to 'b'
    soulStore.setState({ b: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand: Update with 100k global subscribers (b)', () => {
    // Zustand notifies everyone regardless of what changed
    zustandStore.setState({ b: Math.random() });
  });
});

describe('Subscriber Creation Stress', () => {
  bench('SoulState: Create 10,000 Subscribers', () => {
    const store = createSoulState({ a: 1 });
    for (let i = 0; i < 10000; i++) {
      store.subscribe(s => s.a, () => {});
    }
    store.destroy();
  });

  bench('Zustand: Create 10,000 Subscribers', () => {
    const store = createZustand(() => ({ a: 1 }));
    for (let i = 0; i < 10000; i++) {
      store.subscribe(() => {});
    }
  });
});
