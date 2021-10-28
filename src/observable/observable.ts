import { getStateValue, subscribe, unsubscribe } from '../core/core';
import { STATE_KEY } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';

export interface Observable<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>): () => void;
}

export const observableProto = {
  __proto__: Function.prototype,

  get() {
    return getStateValue((this as any)[STATE_KEY]);
  },

  subscribe(subscriber: any) {
    subscribe(this as any, subscriber);
    return () => unsubscribe(this as any, subscriber);
  }
}
