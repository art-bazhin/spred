import { WritableSignal, SignalOptions } from '../core/core';

/**
 * Сreate a writable signal.
 * @returns A writable signal.
 */
export function writable<T>(): WritableSignal<T | undefined>;

/**
 * Сreate a writable signal.
 * @param value An initial value of the signal.
 * @param options Signal options.
 * @returns A writable signal.
 */
export function writable<T>(
  value: T,
  options?: SignalOptions<T>
): WritableSignal<T>;

export function writable(value?: any, options?: any) {
  return new (WritableSignal as any)(value, options);
}
