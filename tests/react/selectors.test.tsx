import React from "react";
import { render, screen, act } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { createStore } from "../../src/core/store";
import { useStore } from "../../src/react/useStore";
import { derived } from "../../src/core/selectors";

test("React: should work with derived selectors", async () => {
  const store = createStore({ a: 1, b: 2 });
  const sumSelector = (s: any) => s.a + s.b;
  const doubledSumSelector = derived(sumSelector, (s) => s * 2);

  function Display() {
    const val = useStore(store, doubledSumSelector);
    return <div>Val: {val}</div>;
  }

  render(<Display />);
  expect(screen.getByText("Val: 6")).toBeInTheDocument();

  await act(async () => {
    store.setState({ a: 2 });
    await Promise.resolve();
  });

  expect(screen.getByText("Val: 8")).toBeInTheDocument();
});

test("React: should handle nested computed values in components", async () => {
  const store = createStore({ count: 1 });
  const double = store.computed((s: any) => s.count * 2);
  const quadruple = store.computed(() => double.value * 2);

  const renderCount = vi.fn();

  function Display() {
    renderCount();
    const val = useStore(store, () => quadruple.value);
    return <div>Val: {val}</div>;
  }

  render(<Display />);
  expect(screen.getByText("Val: 4")).toBeInTheDocument();
  expect(renderCount).toHaveBeenCalledTimes(1);

  await act(async () => {
    store.setState({ count: 2 });
    await Promise.resolve();
  });

  expect(screen.getByText("Val: 8")).toBeInTheDocument();
  expect(renderCount).toHaveBeenCalledTimes(2);
});
