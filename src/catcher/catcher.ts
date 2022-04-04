import { createComputed } from '../computed/computed';
import { State } from '../state/state';
import { isSignal } from '../guards/guards';

export function createCatcher<T>(
  fn: (prevValue?: T) => T,
  catchException: (e: unknown, lastValue?: T) => T
) {
  const src = isSignal(fn) ? fn : createComputed(fn);

  const comp = createComputed((prevValue: any) => {
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
