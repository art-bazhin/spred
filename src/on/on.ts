import { Signal } from '../signal-type/signal-type';
import { Subscriber } from '../subscriber/subscriber';

/**
 * Subscribes the function to updates of the signal value.
 * @param signal Signal.
 * @param subscriber Function that listens to the signal updates.
 * @returns Unsubscribe function.
 */
export function on<T>(
  signal: Signal<T>,
  subscriber: Subscriber<Exclude<T, void>>
) {
  return signal.subscribe(subscriber, false);
}
