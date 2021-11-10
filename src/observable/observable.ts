import { getStateValue, addSubscriber, removeSubscriber } from '../core/core';
import { Signal } from '../signal/signal';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';

export interface Observable<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>, emitOnSubscribe?: boolean): () => void;

  readonly activated: Signal<void>;
  readonly deactivated: Signal<void>;
  readonly exception: Signal<unknown>;
}

export interface _Observable<T> extends Observable<T> {
  _state: State<T>;
}

export const observableProto = {
  get() {
    return getStateValue((this as any)._state);
  },

  subscribe(subscriber: any, emitOnSubscribe = true) {
    addSubscriber(this as any, subscriber, emitOnSubscribe);
    return () => removeSubscriber(this as any, subscriber);
  },
};
