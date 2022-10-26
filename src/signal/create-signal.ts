import { Signal } from './signal';
import { computed } from '../computed/computed';
import { writable } from '../writable/writable';
import { Filter } from '../filter/filter';

type Setter<T> = (
  payload: Exclude<T, Function> | ((currentValue: T) => T)
) => T;

export function signal(): [Signal<unknown>, () => unknown];

export function signal<T>(): [Signal<T | undefined>, Setter<T>];

export function signal<T>(initialValue: T): [Signal<T>, Setter<T>];

export function signal<T>(
  initialValue: T,
  shouldUpdate: boolean | null
): [Signal<T>, Setter<T>];

export function signal<T>(
  initialValue: T,
  shouldUpdate: Filter<T>
): [Signal<T | undefined>, Setter<T>];

export function signal<T>(
  initialValue: undefined
): [Signal<T | undefined>, Setter<T | undefined>];

export function signal<T>(
  initialValue: undefined,
  shouldUpdate: boolean | null
): [Signal<T | undefined>, Setter<T | undefined>];

export function signal<T>(
  initialValue: undefined,
  shouldUpdate: Filter<T | undefined>
): [Signal<T | undefined>, Setter<T | undefined>];

/**
 * Creates a tuple of signal and setter function
 * @param initialValue Initial value of the signal
 * @param shouldUpdate The function that returns a falsy value if the new signal value should be ignored. Use falsy arg value to emit signal values that are not equal to previous vaslue. Use truthy arg value to emit all signal values.
 * @returns A tuple of signal and setter function
 */
export function signal(initialValue?: any, shouldUpdate?: any) {
  const source = writable(initialValue, true);
  const signal = computed(source, shouldUpdate);

  function set(payload: any) {
    if (!arguments.length) return source({});
    return source(payload);
  }

  return [signal, set];
}
