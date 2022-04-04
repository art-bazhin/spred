import { Signal } from '../signal-type/signal-type';
import { createComputed } from '../computed/computed';
import { createWritable } from '../writable/writable';

export function createSignal(): [Signal<unknown>, () => void];
export function createSignal<T>(): [
  Signal<T | undefined>,
  (payload: T) => void
];
export function createSignal<T>(
  initialValue: T
): [Signal<T>, (payload: T) => void];

/**
 * Creates a tuple of signal and setter function
 * @param initialValue
 * @returns A tuple of signal and setter function
 */
export function createSignal(initialValue?: any) {
  const source = createWritable(initialValue);

  function set(payload: any) {
    if (payload === undefined) source({});
    else source(payload);
  }

  return [createComputed(source), set];
}
