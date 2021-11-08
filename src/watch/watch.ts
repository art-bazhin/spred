import { computed } from '../computed/computed';

function commonSubscriber() {}

export function watch<T>(fn: () => T, handleException?: (e: unknown) => any) {
  const comp = computed(fn, handleException);
  return comp.subscribe(commonSubscriber, false);
}
