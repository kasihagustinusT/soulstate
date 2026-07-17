import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Memory Allocation (Creation)', () => {
  bench('SoulState Store Creation', () => {
    const store = createSoulState({ a: 1, b: 2, c: 3 });
    store.destroy();
  });

  bench('Zustand Store Creation', () => {
    createZustand(() => ({ a: 1, b: 2, c: 3 }));
  });
});

describe('Large State Object Creation', () => {
  const keys = Array.from({ length: 1000 }, (_, i) => `key${i}`);
  const largeState = keys.reduce((acc, key, i) => {
    acc[key] = i;
    return acc;
  }, {} as Record<string, number>);

  bench('SoulState Large Store Init', () => {
    const store = createSoulState(largeState);
    store.destroy();
  });

  bench('Zustand Large Store Init', () => {
    createZustand(() => largeState);
  });
});

describe('Subscription Memory Overhead', () => {
  bench('SoulState 1000 Subscriptions', () => {
    const store = createSoulState({ a: 1 });
    const unsubscribers = [];
    for (let i = 0; i < 1000; i++) {
      unsubscribers.push(store.subscribe(s => s.a, () => {}));
    }
    unsubscribers.forEach(unsub => unsub());
    store.destroy();
  });

  bench('Zustand 1000 Subscriptions', () => {
    const store = createZustand(() => ({ a: 1 }));
    const unsubscribers = [];
    for (let i = 0; i < 1000; i++) {
      unsubscribers.push(store.subscribe(() => {}));
    }
    unsubscribers.forEach(unsub => unsub());
  });
});
