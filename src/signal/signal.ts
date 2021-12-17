import { endEmitingSignal, startEmitingSignal } from '../core/core';
import { Listener } from '../listener/listener';
import { removeFromArray } from '../utils/removeFromArray';

/**
 * Event which can be listened using the {@link on} function
 */
export interface Signal<T> {
  ['']: T;
}

export interface _Signal<T> extends Signal<T> {
  _listeners: Listener<T>[];
}

export type SignalResult<T> = unknown extends T
  ? [Signal<T>, (payload?: T) => void]
  : [Signal<T>, (payload: T) => void];

/**
 * Creates a tuple of signal and signal trigger function.
 * @returns Tuple of signal and signal trigger function.
 */
export function signal<T>() {
  const s = {
    _listeners: [],
  } as any;

  return [s, (payload: T) => emitSignal(s, payload)] as SignalResult<T>;
}

export function addListener<T>(signal: _Signal<T>, listener: Listener<T>) {
  const listeners = signal._listeners;

  if (listeners.indexOf(listener) > -1) return;
  listeners.push(listener);

  return () => removeFromArray(listeners, listener);
}

function emitSignal<T>(signal: _Signal<T>, payload: T) {
  if (payload === (undefined as any)) return;

  startEmitingSignal();

  signal._listeners.forEach((listener) => listener(payload));

  endEmitingSignal();
}
