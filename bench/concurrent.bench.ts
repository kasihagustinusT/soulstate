import { bench, describe } from 'vitest';
import { createStore as createSoulState } from '../src/core/store';

describe('Concurrent Update Throughput', () => {
  const soulStore = createSoulState({ count: 0 });

  // SoulState uses microtask batching, so concurrent updates in the same tick 
  // should be efficiently merged.

  bench('10 Parallel Updates (Promise.all)', async () => {
    await Promise.all(
      Array.from({ length: 10 }).map(async (_, i) => {
        soulStore.setState({ count: i });
      })
    );
    await Promise.resolve();
  });

  bench('10 Interleaved Read/Write', async () => {
    for (let i = 0; i < 10; i++) {
      soulStore.setState({ count: i });
      soulStore.getState(); // Interleaved read
    }
    await Promise.resolve();
  });
});

describe('Subscriber Scalability under Concurrency', () => {
  const soulStore = createSoulState({ count: 0 });
  for (let i = 0; i < 1000; i++) {
    soulStore.subscribe(s => s.count, () => {});
  }

  bench('10 Concurrent Updates with 1000 Subscribers', async () => {
    await Promise.all(
      Array.from({ length: 10 }).map(async (_, i) => {
        soulStore.setState({ count: i });
      })
    );
    await Promise.resolve();
  });
});
