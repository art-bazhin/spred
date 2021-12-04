import { Atom } from '../atom/atom';
import { Listener } from '../listener/listener';
import { addListener, Signal } from '../signal/signal';
import { Subscriber } from '../subscriber/subscriber';
import { NULL } from '../utils/constants';

export function on<T>(
  atom: Atom<T>,
  subscriber: Subscriber<Exclude<T, NULL>>
): () => void;

export function on<T>(signal: Signal<T>, listener: Listener<T>): () => void;

export function on(atomOrSignal: any, listener: any) {
  if (atomOrSignal.subscribe) return atomOrSignal.subscribe(listener, false);
  return addListener(atomOrSignal, listener);
}
