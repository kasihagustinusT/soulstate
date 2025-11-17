import { render, screen } from '@testing-library/react';
import React from 'react';
import { expect, test, vi } from 'vitest';
import { createStore } from '../../src/core/store';
import { Provider, useStoreContext } from '../../src/react/provider';
import { useStore } from '../../src/react/useStore';

interface ContextState {
    value: string;
}

test('Provider should provide the correct store to context', () => {
  const store = createStore<ContextState>({ value: 'context-value' });

  function Component() {
    const storeFromContext = useStoreContext<ContextState>();
    const value = useStore(storeFromContext, s => s.value);
    return <div>Value: {value}</div>;
  }

  render(
    <Provider store={store}>
      <Component />
    </Provider>
  );

  expect(screen.getByText('Value: context-value')).toBeInTheDocument();
});

test('useStoreContext should throw if not within a Provider', () => {
    // Suppress console.error from React
    const err = console.error;
    console.error = vi.fn();

    function Component() {
        useStoreContext();
        return null;
    }
    expect(() => render(<Component />)).toThrow('useStoreContext must be used within a Provider');
    
    console.error = err; // Restore
});