export function createBatch() {
  return {
    batch(callback: () => void, store: any) {
      if (store.batch) {
        store.batch(callback);
      } else {
        callback();
      }
    },
  };
}

export const soulBatch = createBatch();
