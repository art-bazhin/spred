import {
  createState,
  getValue,
  setValues,
  STATE_KEY,
  unsubscribe,
  subscribe,
} from './core';
import { Subscriber } from './subscriber';

export interface Subject<T> {
  (value: T): void;
  (): T;
  subscribe(subscriber: Subscriber<T>): () => void;
}

export function createSubject<T>(value: T) {
  const f = function (value?: T) {
    if (value === undefined) return getValue(f);

    setValues([f, value]);
  } as Subject<T>;

  f.subscribe = function (subscriber: Subscriber<T>) {
    subscribe(f, subscriber);
    return () => unsubscribe(f, subscriber);
  };

  (f as any)[STATE_KEY] = createState(value);

  return f;
}
