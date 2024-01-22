import { _WritableSignal, WritableSignal, SignalOptions } from '../core/core';

/**
 * Сreates a writable signal.
 * @returns A writable signal.
 */
export function writable(): WritableSignal<unknown>;

/**
 * Сreates a writable signal.
 * @param value An initial value of the signal.
 * @param options Signal options.
 * @returns A writable signal.
 */
export function writable<T>(
  value: T,
  options?: SignalOptions<T>,
): WritableSignal<T>;

export function writable(value?: any, options?: any) {
  return new (_WritableSignal as any)(value, options);
}
