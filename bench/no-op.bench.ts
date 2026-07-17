import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';
import { atom, createStore as createJotaiStore } from 'jotai';

describe('No-op Update Elimination (1,000 subscribers)', () => {
  const initialState = { a: 1, b: 2 };
  
  // SoulState
  const soulStore = createSoulState(initialState);
  for (let i = 0; i < 1000; i++) {
    soulStore.subscribe(s => s.a, () => {});
  }

  // Zustand
  const zustandStore = createZustand(() => initialState);
  for (let i = 0; i < 1000; i++) {
    zustandStore.subscribe((state: any) => state.a);
  }

  // Jotai
  const jotaiStore = createJotaiStore();
  const aAtom = atom(1);
  const bAtom = atom(2);
  for (let i = 0; i < 1000; i++) {
    jotaiStore.sub(aAtom, () => {});
  }

  bench('SoulState No-op (update b, listeners on a)', async () => {
    soulStore.setState({ b: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand No-op (update b, listeners on a)', () => {
    // Zustand notifies all subscribers on ANY state change
    zustandStore.setState({ b: Math.random() });
  });

  bench('Jotai No-op (update b, listeners on a)', () => {
    jotaiStore.set(bAtom, Math.random());
  });
});

describe('Same-Value Update Elimination', () => {
  const soulStore = createSoulState({ a: 1 });
  for (let i = 0; i < 1000; i++) {
    soulStore.subscribe(s => s.a, () => {});
  }

  const zustandStore = createZustand(() => ({ a: 1 }));
  for (let i = 0; i < 1000; i++) {
    zustandStore.subscribe((state: any) => state.a);
  }

  bench('SoulState Same-Value', async () => {
    soulStore.setState({ a: 1 });
    await Promise.resolve();
  });

  bench('Zustand Same-Value', () => {
    zustandStore.setState({ a: 1 });
  });
});
