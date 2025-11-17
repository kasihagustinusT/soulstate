// A robust shallow equality checker
export const shallow = <T, U>(a: T, b: U): boolean => {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is((a as any)[key], (b as any)[key])) {
      return false;
    }
  }

  return true;
};