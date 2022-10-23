import { Signal, signalProto, _Signal } from '../signal/signal';
import { getStateValue, update } from '../core/core';
import { createSignalState } from '../signal-state/signal-state';
import { Filter } from '../filter/filter';

const writableSignalProto = {
  ...signalProto,

  set(this: _Signal<any>, value: any) {
    return update(this._state, value);
  },

  notify(this: _Signal<any>) {
    return update(this._state);
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
   * Set the value of the signal
   * @param value New value of the signal.
   */
  (value: Exclude<T, Function>): T;

  /**
   * Calculate and set a new value of the signal from the current value
   * @param getNextValue Function that calculates a new value from the current value.
   */
  (getNextValue: (currentValue: T) => T): T;

  /**
   * Set the value of the signal
   * @param value New value of the signal.
   */
  set(value: Exclude<T, Function>): T;

  /**
   * Calculate and set a new value of the signal from the current value
   * @param getNextValue Function that calculates a new value from the current value.
   */
  set(getNextValue: (currentValue: T) => T): T;

  /**
   * Notify subscribers without setting a new value.
   */
  notify(): T;
}

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function writable<T>(): WritableSignal<T | undefined>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @param filter The function that returns a falsy value if the new signal value should be ignored. Use undefined arg value to emit signal values that are not equal to previous vaslue. Use false arg value to emit all signal values.
 * @returns Writable signal.
 */

export function writable<T>(
  value: T,
  filter?: Filter<T> | false
): WritableSignal<T>;

export function writable<T>(
  value: undefined,
  filter?: Filter<T> | false
): WritableSignal<T | undefined>;

export function writable(value?: any, filter?: any) {
  const state = createSignalState(value, undefined);
  const self: any = writableSelf.bind(state);

  if (filter !== undefined) state.filter = filter;

  self._state = state;
  self.set = writableSignalProto.set;
  self.get = writableSignalProto.get;
  self.notify = writableSignalProto.notify;
  self.subscribe = writableSignalProto.subscribe;
  self.sample = writableSignalProto.sample;

  return self;
}
