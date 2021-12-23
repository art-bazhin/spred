import { Signal } from '../signal-base/signal-base';
import { Subscriber } from '../subscriber/subscriber';

/**
 * Subscribes the function to updates of the atom value.
 * @param atom Atom.
 * @param subscriber Function that listens to the atom updates.
 * @returns Unsubscribe function.
 */
export function on<T>(
  atom: Signal<T>,
  subscriber: Subscriber<Exclude<T, void>>
) {
  return atom.subscribe(subscriber, false);
}
