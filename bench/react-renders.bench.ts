import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('React Hook Logic Overhead', () => {
  const soulStore = createSoulState({ a: 1, b: 2 });
  const zustandStore = createZustand(() => ({ a: 1, b: 2 }));

  bench('SoulState: Selector-based Subscription Overhead', () => {
    const unsub = soulStore.subscribe(s => s.a, () => {});
    unsub();
  });

  bench('Zustand: Global Subscription Overhead', () => {
    const unsub = zustandStore.subscribe(() => {});
    unsub();
  });

  bench('SoulState: getSnapshot Performance', () => {
    soulStore.getState().a;
  });

  bench('Zustand: getSnapshot Performance', () => {
    zustandStore.getState().a;
  });
});

describe('Simulated React Update Cycle', () => {
  // SoulState uses microtask batching, which aligns with React's batching
  // but adds a small overhead for the scheduler.
  
  const soulStore = createSoulState({ a: 1 });
  const zustandStore = createZustand(() => ({ a: 1 }));

  bench('SoulState Update -> Render Cycle', async () => {
    // 1. User Action (setState)
    soulStore.setState({ a: Math.random() });
    
    // 2. Propagation (Microtask)
    await Promise.resolve();
    
    // 3. React Render (getSnapshot)
    soulStore.getState().a;
  });

  bench('Zustand Update -> Render Cycle', () => {
    // 1. User Action (setState)
    zustandStore.setState({ a: Math.random() });
    
    // 2. React Render (getSnapshot)
    // Zustand notifies synchronously, so render happens immediately in many cases
    zustandStore.getState().a;
  });
});
