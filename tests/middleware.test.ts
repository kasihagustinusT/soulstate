import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../src/core/store";
import { persist } from "../src/middleware/persist";
import { devtools } from "../src/middleware/devtools";

interface MiddlewareState {
  count: number;
  name: string;
}

function createMockStorage(initial?: Record<string, string>) {
  const store: Record<string, string> = initial ? { ...initial } : {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    _raw: store,
  };
}

describe("Persist Middleware", () => {
  test("should initialize with default state when storage is empty", () => {
    const storage = createMockStorage();

    const store = createStore(
      persist({ key: "test-store", storage })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 0, name: "initial" });
  });

  test("should rehydrate from storage", () => {
    const storage = createMockStorage({
      "test-store": JSON.stringify({ count: 42, name: "hydrated" }),
    });

    const store = createStore(
      persist({ key: "test-store", storage })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 42, name: "hydrated" });
  });

  test("should merge stored state with initial state", () => {
    const storage = createMockStorage({
      "test-store": JSON.stringify({ count: 42 }),
    });

    const store = createStore(
      persist({ key: "test-store", storage })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 42, name: "initial" });
  });

  test("should persist on creator set calls", () => {
    const storage = createMockStorage();

    const store = createStore(
      persist({ key: "test-store", storage })((set, _get) => ({
        count: 0,
        name: "initial",
        increment: () => set((s) => ({ ...s, count: s.count + 1 })),
      })),
    );

    (store.getState() as any).increment();

    expect(storage._raw["test-store"]).toBe(
      JSON.stringify({ count: 1, name: "initial" }),
    );
  });

  test("should use custom serialize/deserialize", () => {
    const storage = createMockStorage({
      "test-store": "count=42|name=hydrated",
    });

    const store = createStore(
      persist({
        key: "test-store",
        storage,
        serialize: (state) => `count=${state.count}|name=${state.name}`,
        deserialize: (str) => {
          const parts = str.split("|");
          return {
            count: parseInt(parts[0].split("=")[1]),
            name: parts[1].split("=")[1],
          } as MiddlewareState;
        },
      })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 42, name: "hydrated" });
  });

  test("should handle storage read errors gracefully", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const storage = {
      getItem: () => {
        throw new Error("Read error");
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      get length() {
        return 0;
      },
      key: () => null,
    };

    const store = createStore(
      persist({ key: "test-store", storage })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 0, name: "initial" });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("should handle storage write errors gracefully", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("Write error");
      },
      removeItem: vi.fn(),
      clear: vi.fn(),
      get length() {
        return 0;
      },
      key: () => null,
    };

    const store = createStore(
      persist({ key: "test-store", storage })((set, _get) => ({
        count: 0,
        name: "initial",
        increment: () => set((s) => ({ ...s, count: s.count + 1 })),
      })),
    );

    (store.getState() as any).increment();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("should handle no storage gracefully", () => {
    const store = createStore(
      persist({
        key: "test-store",
        storage: undefined,
      })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 0, name: "initial" });
  });
});

describe("DevTools Middleware", () => {
  let mockDevTools: any;

  beforeEach(() => {
    mockDevTools = {
      init: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn(),
    };

    (globalThis as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: vi.fn().mockReturnValue(mockDevTools),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  test("should initialize devtools in browser environment", () => {
    createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(mockDevTools.init).toHaveBeenCalledWith({
      count: 0,
      name: "initial",
    });
  });

  test("should subscribe to devtools messages", () => {
    createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(mockDevTools.subscribe).toHaveBeenCalledTimes(1);
    expect(typeof mockDevTools.subscribe.mock.calls[0][0]).toBe("function");
  });

  test("should send actions to devtools on creator set calls", () => {
    const store = createStore(
      devtools({ name: "Test Store" })((set, get) => ({
        count: 0,
        name: "initial",
        increment: () => {
          const prev = get();
          set({ count: prev.count + 1 });
        },
      })),
    );

    (store.getState() as any).increment();

    expect(mockDevTools.send).toHaveBeenCalledTimes(1);
    const [action, newState, prevState] = mockDevTools.send.mock.calls[0];
    expect(action).toBe("setState");
    expect(newState.count).toBe(1);
    expect(newState.name).toBe("initial");
    expect(prevState.count).toBe(0);
    expect(prevState.name).toBe("initial");
  });

  test("should handle JUMP_TO_STATE dispatch", () => {
    const store = createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    const subscribeCallback = mockDevTools.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ count: 42, name: "jumped" }),
    });

    expect(store.getState()).toEqual({ count: 42, name: "jumped" });
  });

  test("should handle JUMP_TO_ACTION dispatch", () => {
    const store = createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    const subscribeCallback = mockDevTools.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_ACTION" },
      state: JSON.stringify({ count: 99, name: "jumped-action" }),
    });

    expect(store.getState()).toEqual({ count: 99, name: "jumped-action" });
  });

  test("should not send to devtools when applying devtools state", () => {
    createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    const subscribeCallback = mockDevTools.subscribe.mock.calls[0][0];

    // Reset call count
    mockDevTools.send.mockClear();

    // Apply devtools state
    subscribeCallback({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ count: 42, name: "jumped" }),
    });

    // Should NOT have sent to devtools since we're applying devtools state
    expect(mockDevTools.send).not.toHaveBeenCalled();
  });

  test("should use default name when not provided", () => {
    createStore(
      devtools()((_set, _get) => ({
        count: 0,
      })),
    );

    expect(
      (globalThis as any).window.__REDUX_DEVTOOLS_EXTENSION__.connect,
    ).toHaveBeenCalledWith({
      name: "SoulState",
    });
  });

  test("should work without devtools extension", () => {
    delete (globalThis as any).window.__REDUX_DEVTOOLS_EXTENSION__;

    const store = createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 0, name: "initial" });
  });

  test("should work in non-browser environment", () => {
    delete (globalThis as any).window;

    const store = createStore(
      devtools({ name: "Test Store" })((_set, _get) => ({
        count: 0,
        name: "initial",
      })),
    );

    expect(store.getState()).toEqual({ count: 0, name: "initial" });
  });
});
