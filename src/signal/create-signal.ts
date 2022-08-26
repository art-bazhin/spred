import { Signal } from './signal';
import { computed } from '../computed/computed';
import { update } from '../core/core';

export function signal(): [Signal<unknown>, () => void];
export function signal<T>(): [Signal<T | undefined>, (payload: T) => void];
export function signal<T>(initialValue: T): [Signal<T>, (payload: T) => void];

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
    else value = payload;

    update((signal as any)._state);
  }

  return [signal, set];
}
