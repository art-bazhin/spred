import { Signal } from './signal';
import { computed } from '../computed/computed';
import { writable } from '../writable/writable';

export function signal(): [Signal<unknown>, () => void];
export function signal<T>(): [Signal<T | undefined>, (payload: T) => void];
export function signal<T>(initialValue: T): [Signal<T>, (payload: T) => void];

/**
 * Creates a tuple of signal and setter function
 * @param initialValue
 * @returns A tuple of signal and setter function
 */
export function signal(initialValue?: any) {
  const source = writable(initialValue);

  function set(payload: any) {
    if (payload === undefined) source({});
    else source(payload);
  }

  return [computed(source), set];
}
