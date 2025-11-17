import { bench, describe } from 'vitest';
import { createStore } from '../src/core/store';

// Mock stores for comparison
const createZustandMock = () => {
  let state = 0;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (updater: (s: number) => number) => {
      state = updater(state);
      listeners.forEach(l => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

describe('100k Sequential Updates', () => {
  bench('SoulState', () => {
    const store = createStore({ count: 0 });
    for (let i = 0; i < 100000; i++) {
      store.set({ count: i });
    }
  });

  bench('Zustand (Mock)', () => {
    const store = createZustandMock();
    for (let i = 0; i < 100000; i++) {
      store.setState(() => i);
    }
  });
});

describe('10k Updates with 100 Subscribers', () => {
    bench('SoulState', () => {
        const store = createStore({ count: 0 });
        for(let i = 0; i < 100; i++) {
            store.subscribe(s => s.count, () => {});
        }

        for (let i = 0; i < 10000; i++) {
            store.set({ count: i });
        }
    });

    bench('Zustand (Mock)', () => {
        const store = createZustandMock();
        for(let i = 0; i < 100; i++) {
            store.subscribe(() => {});
        }

        for (let i = 0; i < 10000; i++) {
            store.setState(() => i);
        }
    });
});

describe('100k Selector Reads', () => {
    bench('SoulState', () => {
        const store = createStore({ count: 0, user: { name: 'test' } });
        const selectUser = (s: typeof store) => s.get().user;
        for (let i = 0; i < 100000; i++) {
            selectUser(store);
        }
    });
});
