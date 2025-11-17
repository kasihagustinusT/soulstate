// Default equality function is referential equality
export const objectIs = (a: any, b: any): boolean => Object.is(a, b);