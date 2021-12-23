import { Signal, signalProto, _Signal } from '../signal-base/signal-base';
import { update } from '../core/core';
import { createState } from '../state/state';

const signalSignalProto = {
  ...signalProto,

  set(this: _Signal<any>, value: any) {
    update(this, value);
  },

  notify(this: _Signal<any>) {
    update(this);
  },
};

/**
 * An signal whose value can be set.
 */
export interface WritableSignal<T> extends Signal<T> {
  /**
   * Sets the value of the signal
   * @param value New value of the signal.
   */
  (value: T): T;

  /**
   * Sets the value of the signal
   * @param value New value of the signal.
   */
  set(value: T): T;

  /**
   * Notify subscribers without setting a new value.
   */
  notify(): T;

  value(): T;
}

/**
 * Сreates a signal signal.
 * @returns Writable signal.
 */
export function signal<T>(): WritableSignal<T | undefined>;

/**
 * Сreates a signal signal.
 * @param value Initial value of the signal.
 * @returns Writable signal.
 */
export function signal<T>(value: T): WritableSignal<T>;

export function signal(value?: any) {
  const f: any = function (value?: any) {
    if (!arguments.length) return f.get();
    return f.set(value);
  };

  f._state = createState(value, undefined, undefined);

  f.constructor = signal;
  f.set = signalSignalProto.set;
  f.get = signalSignalProto.get;
  f.notify = signalSignalProto.notify;
  f.subscribe = signalSignalProto.subscribe;
  f.value = signalSignalProto.value;

  return f;
}
