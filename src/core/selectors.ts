
// This file is a placeholder for selector utilities like createSelector
export const memoize = (fn: (...args: any[]) => any) => {
  // Basic memoization logic
  // A real implementation would use a Map or WeakMap
  const cache = new Map();
  return (...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
