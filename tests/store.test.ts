import { test, expect, vi } from 'vitest';

import { createStore } from '../src/core/store';
import { shallow } from '../src/utils/shallow';

interface CounterState {
  count: number;
}

test('should create a store with initial state', () => {
  const store = createStore<CounterState>({ count: 0 });
  expect(store.get()).toEqual({ count: 0 });
});

test('should update state with set', () => {
  const store = createStore<CounterState>({ count: 0 });
  store.set({ count: 1 });
  expect(store.get().count).toBe(1);
});

test('should update state with a function updater', () => {
  const store = createStore<CounterState>({ count: 1 });
  store.set((state) => ({ count: state.count + 1 }));
  expect(store.get().count).toBe(2);
});

test('should notify subscribers on state change', async () => {
  const store = createStore<CounterState>({ count: 0 });
  const listener = vi.fn();

  store.subscribe((state) => state.count, listener);

  store.set({ count: 1 });

  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith(1, 0);
  expect(listener).toHaveBeenCalledTimes(1);
});

test('should not notify subscribers if selected state is the same', async () => {
  const store = createStore({ user: { name: 'A' }, count: 0 });
  const listener = vi.fn();

  store.subscribe((state) => state.user, listener, { equalityFn: shallow });

  store.set({ count: 1 });

  await Promise.resolve();

  expect(listener).not.toHaveBeenCalled();
});

test('should unsubscribe correctly', async () => {
  const store = createStore<CounterState>({ count: 0 });
  const listener = vi.fn();

  const unsubscribe = store.subscribe((state) => state.count, listener);

  unsubscribe();

  store.set({ count: 1 });

  await Promise.resolve();

  expect(listener).not.toHaveBeenCalled();
});

test('multiple set calls should be batched into a single notification', async () => {
  const store = createStore<CounterState>({ count: 0 });
  const listener = vi.fn();
  const initialState = store.get();

  store.subscribe((state) => state.count, listener);

  store.set({ count: 1 });
  store.set({ count: 2 });
  store.set({ count: 3 });

  expect(listener).not.toHaveBeenCalled();

  await Promise.resolve();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(3, initialState.count);
  expect(store.get().count).toBe(3);
});
