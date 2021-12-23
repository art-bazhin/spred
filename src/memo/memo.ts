import { computed } from '../computed/computed';
import { isWritableSignal } from '../utils/isSignal';

function defaultIsEqual<T>(value: T, prevValue: T) {
  return Object.is(value, prevValue);
}

export function memo<T>(
  fn: (prevValue?: T) => T,
  isEqual?: (value: T, prevValue: T) => boolean
) {
  const check = isEqual || defaultIsEqual;
  const valueFn = isWritableSignal(fn) ? () => fn() : fn;

  const comp = computed((prevValue?: T) => {
    const value = valueFn(prevValue);

    if (prevValue && check(value, prevValue)) return undefined as unknown as T;

    return value;
  });

  return comp;
}
