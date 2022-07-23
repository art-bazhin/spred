import { Signal, signalProto, _Signal } from '../signal-type/signal-type';
import { update } from '../core/core';
import { createState } from '../state/state';

const writableSignalProto = {
  ...signalProto,

  set(this: _Signal<any>, value: any) {
    update(this, value);
  },

  notify(this: _Signal<any>) {
    update(this);
  },
};

/**
 * A signal whose value can be set.
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

  sample(): T;
}

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function createWritable<T>(): WritableSignal<T | undefined>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @returns Writable signal.
 */
export function createWritable<T>(value: T): WritableSignal<T>;

export function createWritable(value?: any) {
  const f: any = function (value?: any) {
    if (!arguments.length) return f.get();
    return f.set(value);
  };

  f._state = createState(value, undefined);

  f.constructor = createWritable;
  f.set = writableSignalProto.set;
  f.get = writableSignalProto.get;
  f.notify = writableSignalProto.notify;
  f.subscribe = writableSignalProto.subscribe;
  f.sample = writableSignalProto.sample;

  return f;
}
