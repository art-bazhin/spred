import { WritableSignal, SignalOptions } from '../core/core';

/**
 * Сreates a writable signal.
 * @returns Writable signal.
 */
export function writable(): WritableSignal<unknown>;

/**
 * Сreates a writable signal.
 * @param value Initial value of the signal.
 * @param options Signal options.
 * @returns Writable signal.
 */
export function writable<T>(
  value: T,
  options?: SignalOptions<T>,
): WritableSignal<T>;

export function writable(value?: any, options?: any) {
  return new (WritableSignal as any)(value, options);
}
