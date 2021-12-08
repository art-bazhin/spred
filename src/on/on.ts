import { Atom } from '../atom/atom';
import { Listener } from '../listener/listener';
import { addListener, Signal } from '../signal/signal';
import { Subscriber } from '../subscriber/subscriber';
import { VOID } from '../void/void';

/**
 * Subscribes the function to updates of the atom value.
 * @param atom An atom.
 * @param subscriber A function that subscribes to the atom updates.
 * @returns Unsubscribe function.
 */
export function on<T>(
  atom: Atom<T>,
  subscriber: Subscriber<Exclude<T, VOID>>
): () => void;

/**
 * Subscribes the function to the signal.
 * @param signal A signal.
 * @param listener A function that listens to the signal.
 * @returns Stop listening function.
 */
export function on<T>(signal: Signal<T>, listener: Listener<T>): () => void;

export function on(atomOrSignal: any, listener: any) {
  if (atomOrSignal.subscribe) return atomOrSignal.subscribe(listener, false);
  return addListener(atomOrSignal, listener);
}
