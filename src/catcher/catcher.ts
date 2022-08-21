import { computed } from '../computed/computed';
import { Computation, SignalState } from '../signal-state/signal-state';
import { isSignal } from '../guards/guards';

/**
 * Creates a computed signal that handles exceptions that occur during computations.
 * @param compute The function that calculates the signal value and returns it.
 * @param handle The function that handles an exception and returns the new signal value.
 * @returns Computed signal.
 */
export function catcher<T>(
  compute: Computation<T>,
  handle: (e: unknown, prevValue?: T) => T
) {
  const getValue = isSignal(compute) ? compute : computed(compute);

  const comp = computed((prevValue: any) => {
    const value = getValue();
    const state = (getValue as any)._state as SignalState<T>;

    if (state.hasException) {
      return handle(state.exception, prevValue);
    }

    return value;
  });

  (comp as any)._state.isCatcher = true;

  return comp;
}
