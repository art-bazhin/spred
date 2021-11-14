import { getStateValue, addSubscriber, removeSubscriber } from '../core/core';
import { makeSignal, Signal } from '../signal/signal';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';

export interface Observable<T> {
  (): T;
  get(): T;
  subscribe(subscriber: Subscriber<T>, emitOnSubscribe?: boolean): () => void;
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

export function getObservableSignal<T>(
  observable: Observable<T>,
  signalName: string
) {
  const signals = (observable as any)._state.signals;
  if (!signals[signalName]) signals[signalName] = makeSignal({}, signalName);
  return signals[signalName];
}

export function getObservableSignals<T>(observable: Observable<T>) {
  getObservableSignal(observable, 'activate');
  getObservableSignal(observable, 'deactivate');
  getObservableSignal(observable, 'change');
  getObservableSignal(observable, 'exception');
  getObservableSignal(observable, 'notifyStart');
  getObservableSignal(observable, 'notifyEnd');

  return Object.assign({}, (observable as any)._state.signals) as {
    activate: Signal<T>;
    deactivate: Signal<T>;
    change: Signal<{ value: T; prevValue: T | undefined }>;
    exception: Signal<unknown>;
    notifyStart: Signal<T>;
    notifyEnd: Signal<T>;
  };
}
