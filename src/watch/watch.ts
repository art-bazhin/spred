import { computed } from '../computed/computed';
import { NOOP } from '../utils/functions';
import { isSignal } from '../utils/isSignal';

/**
 * Calls the passed function immediately and every time the signals it depends on are updated.
 * @param fn A function to watch for.
 * @returns Stop watching function.
 */
export function watch<T>(fn: (prevValue?: T) => T) {
  const comp = isSignal(fn) ? fn : computed(fn);
  return comp.subscribe(NOOP);
}
