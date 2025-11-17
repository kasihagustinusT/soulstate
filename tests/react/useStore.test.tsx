import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { expect, test } from 'vitest';

import { createStore } from '../../src/core/store';
import { useStore } from '../../src/react/useStore';

test('useStore should return the selected state and re-render on change', async () => {
  const store = createStore({ count: 0 });
  const increment = () => store.set(s => ({ count: s.count + 1 }));

  function Counter() {
    const count = useStore(store, state => state.count);
    return <div>Count: {count}</div>;
  }

  render(<Counter />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  act(() => {
    increment();
  });

  // Wait for microtask batching
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
