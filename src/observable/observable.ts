import { getStateValue, subscribe, unsubscribe } from '../core/core';
import { STATE_KEY } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';

export interface Observable<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>, emitOnSubscribe?: boolean): () => void;
}

export const observableProto = {
  get() {
    return getStateValue((this as any)[STATE_KEY]);
  },

  subscribe(subscriber: any, emitOnSubscribe = true) {
    subscribe(this as any, subscriber, emitOnSubscribe);
    return () => unsubscribe(this as any, subscriber);
  },
};
