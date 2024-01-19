import { computed } from '../computed/computed';
import { NOOP_FN } from '../common/constants';

/**
 * Calls the passed function immediately and every time the signals it depends on are updated.
 * @param fn A function to watch for.
 * @returns Stop watching function.
 */
export function effect<T>(fn: (prevValue?: T) => T) {
  return computed(fn).subscribe(NOOP_FN);
}
