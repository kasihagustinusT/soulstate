import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Hybrid Dispatcher (8 keys, 1,000 surgical subscribers)', () => {
  const keysCount = 8;
  const subscriberCount = 1000;
  const initialState = Object.fromEntries(Array.from({ length: keysCount }, (_, i) => [`key${i}`, 0]));

  // SoulState (Should use BitmaskDispatcher)
  const soulStore = createSoulState(initialState);
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    soulStore.subscribe(s => s[key], () => {});
  }

  // Zustand
  const zustandStore = createZustand(() => initialState);
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    zustandStore.subscribe((state: any) => state[key]);
  }

  bench('SoulState (Bitmask)', async () => {
    soulStore.setState({ key0: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand (Global)', () => {
    zustandStore.setState({ key0: Math.random() });
  });
});

describe('Large Key Store (64 keys, 1,000 surgical subscribers)', () => {
  const keysCount = 64;
  const subscriberCount = 1000;
  const initialState = Object.fromEntries(Array.from({ length: keysCount }, (_, i) => [`key${i}`, 0]));

  // SoulState (Should use GraphDispatcher)
  const soulStore = createSoulState(initialState);
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    soulStore.subscribe(s => s[key], () => {});
  }

  // Zustand
  const zustandStore = createZustand(() => initialState);
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    zustandStore.subscribe((state: any) => state[key]);
  }

  bench('SoulState (Graph)', async () => {
    soulStore.setState({ key0: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand (Global)', () => {
    zustandStore.setState({ key0: Math.random() });
  });
});
