import { computed } from '../computed/computed';
import { NOOP } from '../utils/functions';

export function watch<T>(fn: () => T, catchException?: (e: unknown) => any) {
  const comp = computed(fn, { catch: catchException });
  return comp.subscribe(NOOP, false);
}
