import {
  createState,
  getValue,
  STATE_KEY,
  unsubscribe,
  subscribe,
} from './core';
import { Subscriber } from './subscriber';

export interface Computed<T> {
  (): T;
  subscribe(subscriber: Subscriber<T>): () => void;
}

export function createComputed<T>(computedFn: () => T) {
  const f = function () {
    return getValue(f);
  } as Computed<T>;

  f.subscribe = function (subscriber: Subscriber<T>) {
    subscribe(f, subscriber);
    return () => unsubscribe(f, subscriber);
  };

  (f as any)[STATE_KEY] = createState(undefined, computedFn);

  return f;
}
