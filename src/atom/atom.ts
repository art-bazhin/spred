import { getStateValue, addSubscriber, removeSubscriber } from '../core/core';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';

export interface Atom<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>, emitOnSubscribe?: boolean): () => void;
}

export interface AtomOptions<T> {
  catch?: (e: unknown, currentValue?: T) => T;
  filter?: (value: T, prevValue?: T) => boolean;
}

export interface _Atom<T> extends Atom<T> {
  _state: State<T>;
}

export const atomProto = {
  get() {
    return getStateValue((this as any)._state);
  },

  subscribe(subscriber: any, emitOnSubscribe = true) {
    addSubscriber(this as any, subscriber, emitOnSubscribe);
    return () => removeSubscriber(this as any, subscriber);
  },
};
