import { computed } from '../computed/computed';
import { NOOP } from '../utils/functions';

export function watch<T>(fn: () => T, handleException?: (e: unknown) => any) {
  const comp = computed(fn, { handleException });
  return comp.subscribe(NOOP, false);
}
