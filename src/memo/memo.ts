import { computed } from '../computed/computed';
import { isWritableSignal } from '../guards/guards';
import { Computation } from '../state/state';

/**
 * Creates a computed signal that triggers its dependants and subscribers only if its value changes.
 * @param compute The function that calculates the signal value and returns it.
 * @param equals The function that checks if the new value is equal to the previous value. Defaults to Object.is.
 * @returns Computed signal.
 */
export function memo<T>(
  compute: Computation<T>,
  equals?: (value: T, prevValue: T) => boolean
) {
  const check = equals || Object.is;
  const getValue = isWritableSignal(compute) ? () => compute() : compute;

  const comp = computed((prevValue: T | undefined, scheduled: boolean) => {
    const value = getValue(prevValue, scheduled);

    if (prevValue === undefined || !check(value, prevValue)) return value;
    return undefined as unknown as T;
  });

  return comp;
}
