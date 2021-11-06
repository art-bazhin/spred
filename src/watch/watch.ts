import { computed } from '../computed/computed';

function commonSubscriber() {}

function createSubscriber(onError?: (err: Error) => any) {
  if (onError)
    return function (_: any, __: any, error?: Error) {
      if (error && onError) onError(error);
    };

  return commonSubscriber;
}

export function watch<T>(fn: () => T, onError?: (err: Error) => any) {
  const comp = computed(fn);
  const subscriber = createSubscriber(onError);

  return comp.subscribe(subscriber, false);
}
