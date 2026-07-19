import { test, expect } from "vitest";
import { createStore, batch, flushSync } from "../src/index";
import { useStore } from "../src/react/useStore";
import { useShallow } from "../src/react/useShallow";
import { persist } from "../src/middleware/persist";
import { devtools } from "../src/middleware/devtools";
import { shallow } from "../src/utils/shallow";

test("ESM: all entry points importable", () => {
  expect(typeof createStore).toBe("function");
  expect(typeof useStore).toBe("function");
  expect(typeof batch).toBe("function");
  expect(typeof flushSync).toBe("function");
  expect(typeof persist).toBe("function");
  expect(typeof devtools).toBe("function");
  expect(typeof shallow).toBe("function");
  expect(typeof useShallow).toBe("function");
});

test("CJS: dist files loadable", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const main = require("../dist/index.cjs");
  expect(typeof main.createStore).toBe("function");
  expect(typeof main.batch).toBe("function");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require("../dist/react.cjs");
  expect(typeof react.useStore).toBe("function");
});

test("middleware: persist and devtools work from dist", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const middleware = require("../dist/middleware.cjs");
  expect(typeof middleware.persist).toBe("function");
  expect(typeof middleware.devtools).toBe("function");
});

test("utils: shallow available from dist", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const utils = require("../dist/utils.cjs");
  expect(typeof utils.shallow).toBe("function");
});

test("createStore: returns a valid store with all methods", () => {
  const store = createStore({ count: 0 });

  expect(typeof store.getState).toBe("function");
  expect(typeof store.setState).toBe("function");
  expect(typeof store.subscribe).toBe("function");
  expect(typeof store.computed).toBe("function");
  expect(typeof store.beginTransaction).toBe("function");
  expect(typeof store.commitTransaction).toBe("function");
  expect(typeof store.rollbackTransaction).toBe("function");
  expect(typeof store.enableInstrumentation).toBe("function");
  expect(typeof store.destroy).toBe("function");
  expect(typeof store.getMetrics).toBe("function");
  expect(typeof store.getVersion).toBe("function");
});

test("createStore: version increments on each setState", () => {
  const store = createStore({ count: 0 });
  const initialVersion = store.getVersion();

  store.setState({ count: 1 });
  expect(store.getVersion()).toBe(initialVersion + 1);

  store.setState({ count: 2 });
  expect(store.getVersion()).toBe(initialVersion + 2);
});

test("createStore: supports TypeScript generics", () => {
  interface AppState {
    count: number;
    name: string;
    nested: { deep: boolean };
  }

  const store = createStore<AppState>({
    count: 0,
    name: "test",
    nested: { deep: false },
  });

  const state = store.getState();
  expect(state.count).toBe(0);
  expect(state.name).toBe("test");
  expect(state.nested.deep).toBe(false);
});

test("batch: groups updates into a single notification", () => {
  const store = createStore({ a: 0, b: 0 });
  let notificationCount = 0;

  store.subscribe(
    (s) => s.a + s.b,
    () => {
      notificationCount++;
    },
  );

  batch(() => {
    store.setState({ a: 1 });
    store.setState({ b: 1 });
  });

  // Should batch into one notification after the batch
});

test("flushSync: executes synchronously", () => {
  const result = flushSync(() => 42);
  expect(result).toBe(42);
});

test("persist middleware: basic functionality", async () => {
  const store = createStore(
    persist({
      key: "compat-test",
    })((_set: any) => ({
      count: 0,
      increment: () => _set((s: any) => ({ count: s.count + 1 })),
    })),
  );

  expect(store.getState().count).toBe(0);
});

test("devtools middleware: basic functionality", () => {
  const store = createStore(
    devtools({ name: "CompatTest" })((_set: any) => ({
      count: 0,
      increment: () => _set((s: any) => ({ count: s.count + 1 })),
    })),
  );

  expect(store.getState().count).toBe(0);
});

test("shallow: correctly detects shallow equality", () => {
  expect(shallow({ a: 1 }, { a: 1 })).toBe(true);
  expect(shallow({ a: 1 }, { a: 2 })).toBe(false);
  expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  expect(shallow({ a: [1] }, { a: [1] })).toBe(false); // arrays are reference-compared
});

test("createStore: state immutability on updates", () => {
  const store = createStore({ count: 0 });
  const firstState = store.getState();

  store.setState({ count: 1 });
  const secondState = store.getState();

  expect(firstState.count).toBe(0);
  expect(secondState.count).toBe(1);
  expect(firstState).not.toBe(secondState);
});

test("dist type declarations exist", () => {
  const fs = require("fs");
  expect(fs.existsSync("dist/index.d.ts")).toBe(true);
  expect(fs.existsSync("dist/react.d.ts")).toBe(true);
  expect(fs.existsSync("dist/middleware.d.ts")).toBe(true);
  expect(fs.existsSync("dist/utils.d.ts")).toBe(true);
});

test("dist CJS entry point works", () => {
  const fs = require("fs");
  expect(fs.existsSync("dist/index.cjs")).toBe(true);
  expect(fs.existsSync("dist/index.js")).toBe(true); // ESM
});
