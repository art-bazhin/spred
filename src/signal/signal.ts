import { Computation, Signal, SignalOptions } from '../core/core';
import { VOID } from '../utils/constants';
import { WritableSignal } from '../writable/writable';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns Computed signal.
 */
export function signal<T>(
  compute: Computation<T>,
): Signal<Exclude<T, typeof VOID>>;

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns Computed signal.
 */
export function signal<T>(
  compute: Computation<T>,
  options: SignalOptions<T>,
): Signal<Exclude<T, typeof VOID>>;

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function signal(): WritableSignal<unknown>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @returns Writable signal.
 */
export function signal<T>(value: T): WritableSignal<Exclude<T, typeof VOID>>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @param options Signal options.
 * @returns Writable signal.
 */
export function signal<T>(
  value: T,
  options: SignalOptions<T>,
): WritableSignal<Exclude<T, typeof VOID>>;

export function signal(value?: any, options?: any) {
  if (typeof value === 'function')
    return new (Signal as any)(undefined, value, options);
  return new (Signal as any)(value, undefined, options);
}
