import { Signal, Subscriber } from '../core/core';

/**
 * Subscribes the function to updates of the signal value.
 * @param signal Signal.
 * @param subscriber Function that listens to the signal updates.
 * @returns Unsubscribe function.
 */
export function on<T>(signal: Signal<T>, subscriber: Subscriber<T>) {
  return signal.subscribe(subscriber, false);
}
