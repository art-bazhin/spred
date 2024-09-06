import {
  Computation,
  Signal,
  WritableSignal,
  SignalOptions,
} from '../core/core';

/**
 * Create a signal that automatically calculates its value based on other signals.
 * @param compute A function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns A computed signal.
 */
export function signal<T>(
  compute: Computation<T>,
  options?: SignalOptions<T>
): Signal<T>;

/**
 * Сreate a writable signal.
 * @returns A writable signal.
 */
export function signal<T>(): WritableSignal<T | undefined>;

/**
 * Сreate a writable signal.
 * @param value An initial value of the signal.
 * @param options Signal options.
 * @returns A writable signal.
 */
export function signal<T>(
  value: Exclude<T, Function>,
  options?: SignalOptions<T>
): WritableSignal<T>;

export function signal(value?: any, options?: any) {
  if (typeof value === 'function') return new (Signal as any)(value, options);
  return new (WritableSignal as any)(value, options);
}
