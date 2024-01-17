import { computed } from '../computed/computed';
import { NOOP_FN } from '../common/constants';
import { isSignal } from '../guards/guards';

/**
 * Calls the passed function immediately and every time the signals it depends on are updated.
 * @param fn A function to watch for.
 * @returns Stop watching function.
 */
export function effect<T>(fn: (prevValue?: T) => T) {
  const comp = isSignal(fn) ? fn : computed(fn);
  return comp.subscribe(NOOP_FN);
}
