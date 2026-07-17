import React, { StrictMode } from "react";
import { render, screen, act } from "@testing-library/react";
import { test, expect } from "vitest";
import { createStore } from "../../src/core/store";
import { useStore } from "../../src/react/useStore";

test("React: should be compatible with StrictMode (double mount)", async () => {
  const store = createStore({ count: 0 });

  function Counter() {
    const count = useStore(store, (s) => s.count);
    return <div>Count: {count}</div>;
  }

  render(
    <StrictMode>
      <Counter />
    </StrictMode>,
  );

  expect(screen.getByText("Count: 0")).toBeInTheDocument();

  await act(async () => {
    store.setState({ count: 1 });
    await Promise.resolve();
  });

  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
