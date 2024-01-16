import { Signal } from './signal';
import { computed } from '../computed/computed';
import { writable } from '../writable/writable';
import { Comparator } from '../core/core';
import { FALSE_FN, VOID } from '../utils/constants';

export type Setter<T> = (
  payload: Exclude<T, Function> | ((currentValue: T) => T),
) => T;

export function signal(): [Signal<unknown>, () => unknown];

export function signal<T>(): [
  Signal<Exclude<T, typeof VOID>, undefined>,
  Setter<T>,
];

export function signal<T>(
  initialValue: T,
  compare?: Comparator<T> | null | undefined,
): [Signal<Exclude<T, typeof VOID>>, Setter<T>];

export function signal<T>(
  initialValue: undefined,
  compare?: Comparator<T> | null | undefined,
): [Signal<Exclude<T, typeof VOID>, undefined>, Setter<T>];

/**
 * Creates a tuple of signal and setter function
 * @param initialValue Initial value of the signal
 * @param compare Function to check if the new value equals to the previous value.
 * @returns A tuple of signal and setter function
 */
export function signal(initialValue?: any, compare?: any) {
  const source = writable(initialValue, FALSE_FN);
  const signal = computed(source, compare);

  function set(payload: any) {
    if (!arguments.length) return source({});
    return source(payload);
  }

  return [signal, set];
}
