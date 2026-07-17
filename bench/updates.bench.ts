import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';
import { atom, createStore as createJotaiStore } from 'jotai';

describe('Sync Update Throughput (Simple Store)', () => {
  const soulStore = createSoulState({ a: 1 });
  const zustandStore = createZustand(() => ({ a: 1 }));
  const jotaiStore = createJotaiStore();
  const aAtom = atom(1);

  bench('SoulState (sync)', () => {
    soulStore.setState({ a: Math.random() }, false, true);
  });

  bench('SoulState (async/batch)', async () => {
    soulStore.setState({ a: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand (sync)', () => {
    zustandStore.setState({ a: Math.random() });
  });

  bench('Jotai (sync)', () => {
    jotaiStore.set(aAtom, Math.random());
  });
});
