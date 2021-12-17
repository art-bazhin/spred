import { Atom } from '../atom/atom';
import { Listener } from '../listener/listener';
import { addListener, Signal } from '../signal/signal';
import { Subscriber } from '../subscriber/subscriber';

/**
 * Subscribes the function to updates of the atom value.
 * @param atom Atom.
 * @param subscriber Function that listens to the atom updates.
 * @returns Unsubscribe function.
 */
export function on<T>(
  atom: Atom<T>,
  subscriber: Subscriber<Exclude<T, void>>
): () => void;

/**
 * Subscribes the function to the signal.
 * @param signal Signal.
 * @param listener Function that listens to the signal.
 * @returns Unsubscribe function.
 */
export function on<T>(signal: Signal<T>, listener: Listener<T>): () => void;

export function on(atomOrSignal: any, listener: any) {
  if (atomOrSignal.subscribe) return atomOrSignal.subscribe(listener, false);
  return addListener(atomOrSignal, listener);
}
