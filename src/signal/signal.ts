import { Listener } from '../listener/listener';
import { removeFromArray } from '../utils/removeFromArray';

export interface Signal<T> {
  ['']: T;
}

export interface _Signal<T> extends Signal<T> {
  _listeners: Listener<T>[];
}

export type SignalResult<T> = unknown extends T
  ? [Signal<T>, (payload?: T) => void]
  : [Signal<T>, (payload: T) => void];

export function signal<T>() {
  const s = {
    _listeners: [],
  } as any;

  return [
    s,
    (payload: T) =>
      s._listeners.forEach((listener: Listener<T>) => listener(payload)),
  ] as SignalResult<T>;
}

export function addListener<T>(signal: _Signal<T>, listener: Listener<T>) {
  const listeners = signal._listeners;

  if (listeners.indexOf(listener) > -1) return;
  listeners.push(listener);

  return () => removeFromArray(listeners, listener);
}
