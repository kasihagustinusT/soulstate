import { bench, describe } from "vitest";
import { createStore } from "../src/core/store";

/* =======================================================
   LIGHTWEIGHT MOCKS FOR OTHER STATE MANAGEMENT LIBRARIES
   ======================================================= */

// Zustand Mock — already included
const createZustandMock = () => {
  let state = 0;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (updater: (s: number) => number) => {
      state = updater(state);
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// Redux-like mock
const createReduxMock = () => {
  let state = { count: 0 };
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch: (partial: any) => {
      state = { ...state, ...partial };
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

// MobX-like reactive store
const createMobxMock = () => {
  let state = { count: 0 };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (partial: any) => {
      Object.assign(state, partial);
      listeners.forEach((l) => l());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};

// Valtio-like proxy store
const createValtioMock = () => {
  const state = { count: 0 };
  const listeners = new Set<() => void>();
  return {
    snapshot: state,
    mutate: (fn: (s: any) => void) => {
      fn(state);
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

// Jotai-like atomic mock
const createJotaiMock = () => {
  let value = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (v: number) => {
      value = v;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

// Nano Stores mock
const createNanoMock = () => {
  let value = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (v: number) => {
      value = v;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

// Signals (Preact/Solid) mock
const createSignalMock = () => {
  let value = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (v: number) => {
      value = v;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

/* =======================================================
   BENCH: 100k Sequential Updates
   ======================================================= */
describe("100k Sequential Updates", () => {
  bench("SoulState", () => {
    const store = createStore({ count: 0 });
    for (let i = 0; i < 100000; i++) store.set({ count: i });
  });

  bench("Zustand (Mock)", () => {
    const store = createZustandMock();
    for (let i = 0; i < 100000; i++) store.setState(() => i);
  });

  bench("Redux (Mock)", () => {
    const store = createReduxMock();
    for (let i = 0; i < 100000; i++) store.dispatch({ count: i });
  });

  bench("MobX (Mock)", () => {
    const store = createMobxMock();
    for (let i = 0; i < 100000; i++) store.set({ count: i });
  });

  bench("Valtio (Mock)", () => {
    const store = createValtioMock();
    for (let i = 0; i < 100000; i++) store.mutate((s) => (s.count = i));
  });

  bench("Jotai (Mock)", () => {
    const store = createJotaiMock();
    for (let i = 0; i < 100000; i++) store.set(i);
  });

  bench("Nano Stores (Mock)", () => {
    const store = createNanoMock();
    for (let i = 0; i < 100000; i++) store.set(i);
  });

  bench("Signals (Mock)", () => {
    const store = createSignalMock();
    for (let i = 0; i < 100000; i++) store.set(i);
  });
});

/* =======================================================
   BENCH: 10k Updates with 100 Subscribers
   ======================================================= */
describe("10k Updates with 100 Subscribers", () => {
  bench("SoulState", () => {
    const store = createStore({ count: 0 });
    for (let i = 0; i < 100; i++)
      store.subscribe((s) => s.count, () => {});
    for (let i = 0; i < 10000; i++) store.set({ count: i });
  });

  bench("Zustand (Mock)", () => {
    const store = createZustandMock();
    for (let i = 0; i < 100; i++) store.subscribe(() => {});
    for (let i = 0; i < 10000; i++) store.setState(() => i);
  });

  bench("Redux (Mock)", () => {
    const store = createReduxMock();
    for (let i = 0; i < 100; i++) store.subscribe(() => {});
    for (let i = 0; i < 10000; i++) store.dispatch({ count: i });
  });

  bench("MobX (Mock)", () => {
    const store = createMobxMock();
    for (let i = 0; i < 100; i++) store.subscribe(() => {});
    for (let i = 0; i < 10000; i++) store.set({ count: i });
  });

  bench("Valtio (Mock)", () => {
    const store = createValtioMock();
    for (let i = 0; i < 100; i++) store.subscribe(() => {});
    for (let i = 0; i < 10000; i++) store.mutate((s) => (s.count = i));
  });

  bench("Signals (Mock)", () => {
    const store = createSignalMock();
    for (let i = 0; i < 100; i++) store.subscribe(() => {});
    for (let i = 0; i < 10000; i++) store.set(i);
  });
});

/* =======================================================
   BENCH: 100k Selector Reads
   ======================================================= */
describe("100k Selector Reads", () => {
  bench("SoulState", () => {
    const store = createStore({ count: 0, user: { name: "test" } });
    const selector = (s: any) => s.user.name;
    for (let i = 0; i < 100000; i++) selector(store.get());
  });

  bench("Redux (Mock)", () => {
    const store = createReduxMock();
    for (let i = 0; i < 100000; i++) store.getState().count;
  });

  bench("MobX (Mock)", () => {
    const store = createMobxMock();
    for (let i = 0; i < 100000; i++) store.get().count;
  });

  bench("Valtio (Mock)", () => {
    const store = createValtioMock();
    for (let i = 0; i < 100000; i++) store.snapshot.count;
  });

  bench("Signals (Mock)", () => {
    const store = createSignalMock();
    for (let i = 0; i < 100000; i++) store.get();
  });
});
