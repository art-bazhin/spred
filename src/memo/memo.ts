import { computed } from '../computed/computed';

function defaultIsEqual<T>(value: T, prevValue?: T) {
  return Object.is(value, prevValue);
}

export function memo<T>(
  computedFn: (currentValue?: T) => T,
  catchException?: ((e: unknown, cuurentValue?: T) => T) | null,
  isEqual = defaultIsEqual
) {
  const comp = computed((currentValue?: T) => {
    const value = computedFn(currentValue);

    if (isEqual(value, currentValue)) return undefined as unknown as T;

    return value;
  }, catchException);

  return comp;
}
