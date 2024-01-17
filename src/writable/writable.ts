import { Signal, SignalOptions } from '../core/core';
import { VOID } from '../utils/constants';

/**
 * A signal whose value can be set.
 */
export interface WritableSignal<T> extends Signal<T> {
  /**
   * Set the value of the signal
   * @param value New value of the signal.
   */
  set(value: T): T;

  /**
   * Notify subscribers without setting a new value.
   */
  set(): T;

  /**
   * Calculate and set a new value of the signal from the current value
   * @param getNextValue Function that calculates a new value from the current value.
   */
  update(getNextValue: (currentValue: T) => T): T;
}

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function writable(): WritableSignal<unknown>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @returns Writable signal.
 */
export function writable<T>(value: T): WritableSignal<Exclude<T, typeof VOID>>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @param options Signal options.
 * @returns Writable signal.
 */
export function writable<T>(
  value: T,
  options: SignalOptions<T>,
): WritableSignal<Exclude<T, typeof VOID>>;

export function writable(value?: any, options?: any) {
  return new (Signal as any)(value, undefined, options);
}
