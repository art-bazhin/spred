import { getStateValue, STATE_KEY, subscribe, unsubscribe } from './core';
import { Subscriber } from './subscriber';

export interface Observable<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>): () => void;
}

export const observableProto = {
  get() {
    return getStateValue((this as any)[STATE_KEY]);
  },

  subscribe(subscriber: any) {
    subscribe(this as any, subscriber);
    return () => unsubscribe(this as any, subscriber);
  }
}
