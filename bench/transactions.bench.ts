import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';

describe('Transaction Efficiency', () => {
  const soulStore = createSoulState({ a: 1, b: 2, c: 3 });
  
  // We measure the overhead of starting/committing vs just multiple setStates
  // SoulState already batches multiple setState calls in the same tick into one microtask,
  // but transactions avoid even that intermediate logic until commit.

  bench('Multiple setStates (Standard Batching)', async () => {
    for (let i = 0; i < 50; i++) {
      soulStore.setState({ a: i });
    }
    await Promise.resolve();
  });

  bench('Multiple setStates (Transaction)', async () => {
    soulStore.beginTransaction();
    for (let i = 0; i < 50; i++) {
      soulStore.setState({ a: i });
    }
    soulStore.commitTransaction();
    await Promise.resolve();
  });
});

describe('Transactional Rollback Performance', () => {
  const soulStore = createSoulState({ a: 1, b: 2 });

  bench('Transaction with Rollback', () => {
    soulStore.beginTransaction();
    for (let i = 0; i < 50; i++) {
      soulStore.setState({ a: i });
    }
    soulStore.rollbackTransaction();
    // Rollback is usually synchronous and cheap as it just discards the buffer
  });
});
