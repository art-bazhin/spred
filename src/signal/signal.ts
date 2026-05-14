import {
  Computation,
  Signal,
  StatefulSignal,
  SignalOptions,
  WritableSignal,
} from '../core/core';

/**
 * Сreates a signal that automatically calculates its value based on other signals.
 * @param compute A function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns A computed signal.
 */
export function signal<T>(
  compute: Computation<T>,
  options?: SignalOptions<T>
): Signal<T>;

/**
 * Сreates a writable signal that automatically calculates its value based on other signals.
 * @param compute A function that calculates the signal value and returns it.
 * @param set A value setter.
 * @param options Signal options.
 * @returns A computed signal.
 */
export function signal<T, S>(
  compute: Computation<T>,
  set: (value: S) => void,
  options?: SignalOptions<T>
): WritableSignal<T, S>;

/**
 * Сreates a stateful signal.
 * @returns A stateful signal.
 */
export function signal<T>(): StatefulSignal<T | undefined>;

/**
 * Сreates a stateful signal.
 * @param value An initial value of the signal.
 * @param options Signal options.
 * @returns A stateful signal.
 */
export function signal<T>(
  value: Exclude<T, Function>,
  options?: SignalOptions<T>
): StatefulSignal<T>;

export function signal(value?: any, setOrOptions?: any, options?: any) {
  if (typeof value === 'function') {
    if (typeof setOrOptions === 'function')
      return new (WritableSignal as any)(value, setOrOptions, options);
    return new (Signal as any)(value, setOrOptions);
  }

  return new (StatefulSignal as any)(value, setOrOptions);
}
