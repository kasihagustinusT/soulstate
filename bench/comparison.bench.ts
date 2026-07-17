import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';
import { create as createZustand } from 'zustand';
import { atom as jotaiAtom, createStore as createJotaiStore } from 'jotai';
import { proxy, subscribe as valtioSubscribe } from 'valtio';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { observable, autorun, runInAction } from 'mobx';
import { atom as nanoAtom } from 'nanostores';
import { signal as preactSignal } from '@preact/signals';
import { createSignal as solidSignal, createRoot as solidRoot, createEffect as solidEffect } from 'solid-js';

describe('Sparse Update Performance (100,000 subscribers, 100 keys)', () => {
  const keysCount = 100;
  const subscriberCount = 100000;
  const initialState = Object.fromEntries(Array.from({ length: keysCount }, (_, i) => [`key${i}`, 0]));

  // SoulState
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

  // Jotai
  const jotaiStore = createJotaiStore();
  const jotaiAtoms = Array.from({ length: keysCount }, (_, i) => jotaiAtom(0));
  for (let i = 0; i < subscriberCount; i++) {
    const a = jotaiAtoms[i % keysCount];
    jotaiStore.sub(a, () => {});
  }

  // Valtio
  const valtioProxy = proxy(initialState);
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    valtioSubscribe(valtioProxy, () => {
        const val = (valtioProxy as any)[key];
    });
  }

  // Redux Toolkit
  const rtkSlice = createSlice({
    name: 'bench',
    initialState,
    reducers: {
      update: (state, action) => {
        const { key, value } = action.payload;
        (state as any)[key] = value;
      }
    }
  });
  const rtkStore = configureStore({ reducer: rtkSlice.reducer });
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    rtkStore.subscribe(() => {
        const val = (rtkStore.getState() as any)[key];
    });
  }

  // MobX
  const mobxObservable = observable(initialState);
  for (let i = 0; i < subscriberCount; i++) {
    const key = `key${i % keysCount}`;
    autorun(() => {
      const val = (mobxObservable as any)[key];
    });
  }

  // Nanostores
  const nanoAtoms = Array.from({ length: keysCount }, (_, i) => nanoAtom(0));
  for (let i = 0; i < subscriberCount; i++) {
    const a = nanoAtoms[i % keysCount];
    a.subscribe(() => {});
  }

  // Preact Signals
  const preactSignals = Array.from({ length: keysCount }, (_, i) => preactSignal(0));
  for (let i = 0; i < subscriberCount; i++) {
    const s = preactSignals[i % keysCount];
    autorun(() => {
      const val = s.value;
    });
  }

  // Solid Signals
  const solidSignals: any[] = [];
  solidRoot(() => {
    for (let i = 0; i < keysCount; i++) {
      const [get, set] = solidSignal(0);
      solidSignals.push({ get, set });
    }
    for (let i = 0; i < subscriberCount; i++) {
      const s = solidSignals[i % keysCount];
      solidEffect(() => {
        const val = s.get();
      });
    }
  });

  bench('SoulState (Surgical)', async () => {
    soulStore.setState({ key0: Math.random() });
    await Promise.resolve();
  });

  bench('Zustand (Global)', () => {
    zustandStore.setState({ key0: Math.random() });
  });

  bench('Jotai (Atomic)', () => {
    jotaiStore.set(jotaiAtoms[0], Math.random());
  });

  bench('Valtio (Proxy)', () => {
    valtioProxy.key0 = Math.random();
  });

  bench('Redux Toolkit (RTK)', () => {
    rtkStore.dispatch(rtkSlice.actions.update({ key: 'key0', value: Math.random() }));
  });

  bench('MobX (Reactive)', () => {
    runInAction(() => {
      (mobxObservable as any).key0 = Math.random();
    });
  });

  bench('Nanostores (Tiny)', () => {
    nanoAtoms[0].set(Math.random());
  });

  bench('Preact Signals', () => {
    preactSignals[0].value = Math.random();
  });

  bench('Solid Signals', () => {
    solidSignals[0].set(Math.random());
  });
});

describe('Subscriber Creation Performance (1,000 subscribers)', () => {
  const initialState = { a: 0 };

  bench('SoulState: Create 1,000 Subscribers', () => {
    const store = createSoulState(initialState);
    for (let i = 0; i < 1000; i++) {
      store.subscribe(s => s.a, () => {});
    }
  });

  bench('Zustand: Create 1,000 Subscribers', () => {
    const store = createZustand(() => initialState);
    for (let i = 0; i < 1000; i++) {
      store.subscribe((s: any) => s.a);
    }
  });

  bench('Jotai: Create 1,000 Subscribers', () => {
    const store = createJotaiStore();
    const aAtom = jotaiAtom(0);
    for (let i = 0; i < 1000; i++) {
      store.sub(aAtom, () => {});
    }
  });
});
