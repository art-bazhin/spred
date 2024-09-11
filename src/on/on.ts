import { Signal, Subscriber } from '../core/core';

/**
 * Subscribes the passed function to updates of the signal value without immediate execution.
 * @param signal The signal being subscribed to.
 * @param subscriber A function subscribed to updates.
 * @returns An unsubscribe function.
 */
export function on<T>(
  signal: Signal<T>,
  subscriber: Subscriber<Exclude<T, undefined>>
) {
  return signal.subscribe(subscriber, false);
}
