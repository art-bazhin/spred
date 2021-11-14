import { getStateValue, addSubscriber, removeSubscriber } from '../core/core';
import { makeSignal, Signal } from '../signal/signal';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';

export interface Atom<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>, emitOnSubscribe?: boolean): () => void;
}

export interface AtomConfig<T> {
  handleException?: (e: unknown, currentValue?: T) => T;
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

export function getAtomSignal<T>(atom: Atom<T>, signalName: string) {
  const signals = (atom as any)._state.signals;
  if (!signals[signalName]) signals[signalName] = makeSignal({}, signalName);
  return signals[signalName];
}

export function getAtomSignals<T>(atom: Atom<T>) {
  getAtomSignal(atom, 'activate');
  getAtomSignal(atom, 'deactivate');
  getAtomSignal(atom, 'change');
  getAtomSignal(atom, 'exception');
  getAtomSignal(atom, 'notifyStart');
  getAtomSignal(atom, 'notifyEnd');

  return Object.assign({}, (atom as any)._state.signals) as {
    activate: Signal<T>;
    deactivate: Signal<T>;
    change: Signal<{ value: T; prevValue: T | undefined }>;
    exception: Signal<unknown>;
    notifyStart: Signal<T>;
    notifyEnd: Signal<T>;
  };
}
