import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Computed State Performance', () => {
  const soulStore = createSoulState({ a: 10, b: 20 });
  const soulComputed = soulStore.computed(s => s.a + s.b);

  const zustandStore = createZustand(() => ({ a: 10, b: 20 }));
  const zustandSelector = (s: any) => s.a + s.b;

  bench('SoulState Computed Access (Cached)', () => {
    soulComputed.value;
  });

  bench('Zustand Selector Access (Recomputed)', () => {
    zustandSelector(zustandStore.getState());
  });

  bench('SoulState Computed Recomputation', async () => {
    soulStore.setState({ a: Math.random() });
    await Promise.resolve();
    soulComputed.value;
  });

  bench('Zustand Selector Recomputation', () => {
    zustandStore.setState({ a: Math.random() });
    zustandSelector(zustandStore.getState());
  });
});

describe('Computed Dependency Tracking', () => {
  const soulStore = createSoulState({ a: 1, b: 2, c: 3 });
  
  // Computed depends on a and b, but NOT c
  const soulComputed = soulStore.computed(s => s.a + s.b);
  
  bench('SoulState Irrelevant Update (c)', async () => {
    soulStore.setState({ c: Math.random() });
    await Promise.resolve();
    soulComputed.value;
  });

  const zustandStore = createZustand(() => ({ a: 1, b: 2, c: 3 }));
  const zustandSelector = (s: any) => s.a + s.b;

  bench('Zustand Irrelevant Update (c)', () => {
    zustandStore.setState({ c: Math.random() });
    zustandSelector(zustandStore.getState());
  });
});
