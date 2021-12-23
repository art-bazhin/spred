import { computed } from '../computed/computed';
import { State } from '../state/state';
import { isSignal } from '../utils/isSignal';

export function catcher<T>(
  fn: (prevValue?: T) => T,
  catchException: (e: unknown, lastValue?: T) => T
) {
  const src = isSignal(fn) ? fn : computed(fn);

  const comp = computed((prevValue: any) => {
    const value = src();
    const state = (src as any)._state as State<T>;

    if (state.hasException) {
      return catchException(state.exception, prevValue);
    }

    return value;
  });

  (comp as any)._state.isCatcher = true;

  return comp;
}
