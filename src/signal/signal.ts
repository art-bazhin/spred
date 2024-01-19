import {
  Computation,
  Signal,
  WritableSignal,
  SignalOptions,
} from '../core/core';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns Computed signal.
 */
export function signal<T>(
  compute: Computation<T>,
  options?: SignalOptions<T>,
): Signal<T>;

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function signal(): WritableSignal<unknown>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @param options Signal options.
 * @returns Writable signal.
 */
export function signal<T>(
  value: T,
  options?: SignalOptions<T>,
): WritableSignal<T>;

export function signal(value?: any, options?: any) {
  if (typeof value === 'function') return new (Signal as any)(value, options);
  return new (WritableSignal as any)(value, options);
}
