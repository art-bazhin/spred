import { WritableSignal, SignalOptions } from '../core/core';
import { VOID } from '../common/constants';

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
  return new (WritableSignal as any)(value, options);
}
