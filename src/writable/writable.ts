import { Signal, signalProto } from '../signal/signal';
import { get, set, createSignalState, Comparator } from '../core/core';
import { VOID } from '../utils/constants';

const writableSignalProto = {
  ...signalProto,

  set(this: Signal<any>, value: any) {
    if (arguments.length) return set((this as any)._state, value);
    return set((this as any)._state);
  },
};

/**
 * A signal whose value can be set.
 */
export interface WritableSignal<T, I = T> extends Signal<T, I> {
  /**
   * Set the value of the signal
   * @param value New value of the signal.
   */
  (value: T): T;

  /**
   * Set the value of the signal
   * @param value New value of the signal.
   */
  set(value: T): T;

  /**
   * Notify subscribers without setting a new value.
   */
  set(): T | I;
}

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function writable<T>(): WritableSignal<T, undefined>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @param compare Function to check if the new value equals to the previous value.
 * @returns Writable signal.
 */
export function writable<T>(
  value: T,
  compare?: Comparator<T> | null | undefined,
): WritableSignal<Exclude<T, typeof VOID>>;

export function writable<T>(
  value: undefined,
  compare?: Comparator<T> | null | undefined,
): WritableSignal<Exclude<T, typeof VOID>, undefined>;

export function writable(value?: any, compare?: any) {
  const state = createSignalState(value, undefined, compare);

  const self: any = function (value?: any) {
    if (!arguments.length) return get(state);
    return set(state, value);
  };

  self._state = state;
  self.set = writableSignalProto.set;
  self.get = writableSignalProto.get;
  self.subscribe = writableSignalProto.subscribe;

  return self;
}
