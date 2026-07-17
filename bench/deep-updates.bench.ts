import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';

describe('Deep Update Propagation (10 levels, 1,000 subscribers)', () => {
  const createDeepState = (depth: number) => {
    let state: any = { value: 0 };
    for (let i = 0; i < depth; i++) {
      state = { child: state };
    }
    return state;
  };

  const soulStore = createSoulState(createDeepState(10));
  for (let i = 0; i < 1000; i++) {
    soulStore.subscribe(s => s.child.child.child.child.child.child.child.child.child.child.value, () => {});
  }

  const zustandStore = createZustand(() => createDeepState(10));
  for (let i = 0; i < 1000; i++) {
    zustandStore.subscribe(s => (s as any).child.child.child.child.child.child.child.child.child.child.value);
  }

  bench('SoulState (deep)', async () => {
    soulStore.setState((s: any) => {
        const next = { ...s };
        next.child.child.child.child.child.child.child.child.child.child.value++;
        return next;
    });
    await Promise.resolve();
  });

  bench('Zustand (deep)', () => {
    zustandStore.setState((s: any) => {
        const next = { ...s };
        next.child.child.child.child.child.child.child.child.child.child.value++;
        return next;
    });
  });
});
