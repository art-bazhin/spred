import { on } from '../signal/signal';
import {
  getObservableSignal,
  Observable,
  _Observable,
} from '../observable/observable';

export function onActivate<T>(
  observable: Observable<T>,
  listener: (value: T) => any
) {
  return on(getObservableSignal(observable, 'activate'), listener);
}

export function onDeactivate<T>(
  observable: Observable<T>,
  listener: (value: T) => any
) {
  return on(getObservableSignal(observable, 'deactivate'), listener);
}

export function onChange<T>(
  observable: Observable<T>,
  listener: (change: { value: T; prevValue: T | undefined }) => any
) {
  return on(getObservableSignal(observable, 'change'), listener);
}

export function onException<T>(
  observable: Observable<T>,
  listener: (e: unknown) => any
) {
  return on(getObservableSignal(observable, 'exception'), listener);
}

export function onNotifyStart<T>(
  observable: Observable<T>,
  listener: (value: T) => any
) {
  return on(getObservableSignal(observable, 'notifyStart'), listener);
}

export function onNotifyEnd<T>(
  observable: Observable<T>,
  listener: (value: T) => any
) {
  return on(getObservableSignal(observable, 'notifyEnd'), listener);
}
