import { getStateValue, addSubscriber, removeSubscriber } from '../core/core';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { VOID } from '../void/void';
import { NOOP } from '../utils/functions';

export interface Atom<T> {
  (): T;
  get(): T;
  value(): T | VOID;
  subscribe(
    subscriber: Subscriber<Exclude<T, VOID>>,
    emitOnSubscribe: false
  ): () => void;
  subscribe(subscriber: Subscriber<T>, emitOnSubscribe: true): () => void;
  subscribe(subscriber: Subscriber<T>): () => void;
  activate(): () => void;
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

  activate() {
    return this.subscribe(NOOP);
  },

  value(this: _Atom<any>) {
    return this._state.value;
  },
};
