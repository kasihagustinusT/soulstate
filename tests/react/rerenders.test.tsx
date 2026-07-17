import { render, screen, act } from "@testing-library/react";
import React from "react";
import { expect, test, vi } from "vitest";

import { createStore } from "../../src/core/store";
import { useStore } from "../../src/react/useStore";
import { useShallow } from "../../src/utils/shallow";

interface RerenderState {
  a: number;
  b: string;
}

test("Component should not re-render if its selected state does not change", async () => {
  const store = createStore<RerenderState>({ a: 0, b: "hello" });
  const renderSpy = vi.fn();

  function ComponentA() {
    const a = useStore(store, (state) => state.a);
    renderSpy();
    return <div>A: {a}</div>;
  }

  render(<ComponentA />);
  expect(renderSpy).toHaveBeenCalledTimes(1);

  await act(async () => {
    store.setState({ b: "world" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  // Should not re-render because `a` did not change
  expect(renderSpy).toHaveBeenCalledTimes(1);

  await act(async () => {
    store.setState({ a: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  // Should re-render now
  expect(renderSpy).toHaveBeenCalledTimes(2);
  expect(screen.getByText("A: 1")).toBeInTheDocument();
});

interface UserState {
  user: { name: string; age: number };
  other: number;
}

test("useShallow prevents re-renders for objects with same values", async () => {
  const store = createStore<UserState>({
    user: { name: "John", age: 30 },
    other: 0,
  });
  const renderSpy = vi.fn();

  function UserComponent() {
    const user = useShallow(store, (s: UserState) => s.user);
    renderSpy();
    return <div>{user.name}</div>;
  }

  render(<UserComponent />);
  expect(renderSpy).toHaveBeenCalledTimes(1);

  await act(async () => {
    store.setState({ other: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  // Should not re-render
  expect(renderSpy).toHaveBeenCalledTimes(1);

  await act(async () => {
    store.setState((s) => ({ user: { ...s.user } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  // Should not re-render thanks to useShallow
  expect(renderSpy).toHaveBeenCalledTimes(1);

  await act(async () => {
    store.setState({ user: { name: "Jane", age: 30 } });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  // Should re-render now
  expect(renderSpy).toHaveBeenCalledTimes(2);
});
