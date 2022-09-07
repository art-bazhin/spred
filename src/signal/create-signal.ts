import { Signal } from './signal';
import { computed } from '../computed/computed';
import { writable } from '../writable/writable';

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
  const source = writable(initialValue);
  const signal = computed(source);

  function set(payload: any) {
    if (!arguments.length) return source({});
    return source(payload);
  }

  return [signal, set];
}
