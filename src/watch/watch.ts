import { computed } from '../computed/computed';
import { NOOP } from '../utils/functions';

/**
 * Calls the passed function immediately and every time the atoms it depends on are updated.
 * @param fn A function to watch for.
 * @param catchException Exception handling function.
 * @returns Stop watching function.
 */
export function watch(fn: () => any, catchException?: (e: unknown) => any) {
  const comp = computed(fn, catchException);
  return comp.subscribe(NOOP);
}
