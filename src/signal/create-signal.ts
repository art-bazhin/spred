import { Signal } from './signal';
import { computed } from '../computed/computed';
import { update } from '../core/core';

type Setter<T> = (
  payload: Exclude<T, Function> | ((currentValue: T) => T)
) => T;

export function signal(): [Signal<unknown>, () => unknown];
export function signal<T>(): [Signal<T | undefined>, Setter<T>];
export function signal<T>(initialValue: T): [Signal<T>, Setter<T>];

/**
 * Creates a tuple of signal and setter function
 * @param initialValue
 * @returns A tuple of signal and setter function
 */
export function signal(initialValue?: any) {
  let value = initialValue;
  const signal = computed(() => value);

  function set(payload: any) {
    if (!arguments.length) value = {};
    else if (typeof payload === 'function') value = payload(value);
    else value = payload;

    update((signal as any)._state);

    return value;
  }

  return [signal, set];
}
