import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Selector Execution Speed', () => {
  const state = { a: 1, b: 2, c: { d: 3 } };
  const soulStore = createSoulState(state);
  const zustandStore = createZustand(() => state);

  const selector = (s: typeof state) => s.c.d;

  bench('SoulState getState + Selector', () => {
    selector(soulStore.getState());
  });

  bench('Zustand getState + Selector', () => {
    selector(zustandStore.getState());
  });
});

describe('Surgical Subscription Propagation', () => {
  // SoulState should be faster here because it only notifies subscribers of the changed key
  // Zustand notifies all subscribers, who then run their selectors to check for equality
  
  const setupSoul = () => {
    const store = createSoulState({ a: 1, b: 2 });
    for (let i = 0; i < 1000; i++) {
      store.subscribe(s => s.a, () => {});
    }
    return store;
  };

  const setupZustand = () => {
    const store = createZustand(() => ({ a: 1, b: 2 }));
    for (let i = 0; i < 1000; i++) {
      // In vanilla zustand, we subscribe to everything and check manually
      // or use a middleware, but standard way is store.subscribe(listener)
      store.subscribe(() => {});
    }
    return store;
  };

  const soulStore = setupSoul();
  const zustandStore = setupZustand();

  bench('SoulState Surgical Update (a)', async () => {
    soulStore.setState({ a: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand Global Update (a)', () => {
    zustandStore.setState({ a: Math.random() });
  });

  bench('SoulState No-op Update (b)', async () => {
    // This should be very fast in SoulState as 'a' subscribers aren't even checked
    soulStore.setState({ b: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand No-op Update (b)', () => {
    // Zustand will notify everyone, who then run their selectors
    zustandStore.setState({ b: Math.random() });
  });
});
