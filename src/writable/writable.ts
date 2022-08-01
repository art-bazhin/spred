import { Signal, signalProto, _Signal } from '../signal/signal';
import { getStateValue, update } from '../core/core';
import { createState } from '../state/state';

const writableSignalProto = {
  ...signalProto,

  set(this: _Signal<any>, value: any) {
    update(this._state, value);
  },

  notify(this: _Signal<any>) {
    update(this._state);
  },
};

function writableSelf(this: any, value: any) {
  if (!arguments.length) return getStateValue(this);
  return update(this, value);
}

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
export function writable<T>(): WritableSignal<T | undefined>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @returns Writable signal.
 */
export function writable<T>(value: T): WritableSignal<T>;

export function writable(value?: any) {
  const state = createState(value, undefined);
  const writable: any = writableSelf.bind(state);

  writable._state = state;
  writable.constructor = writable;
  writable.set = writableSignalProto.set;
  writable.get = writableSignalProto.get;
  writable.notify = writableSignalProto.notify;
  writable.subscribe = writableSignalProto.subscribe;
  writable.sample = writableSignalProto.sample;

  return writable;
}
