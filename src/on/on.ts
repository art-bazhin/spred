import { Atom } from '../atom/atom';
import { Listener } from '../listener/listener';
import { addListener, Signal } from '../signal/signal';
import { Subscriber } from '../subscriber/subscriber';
import { VOID } from '../void/void';

export function on<T>(
  atom: Atom<T>,
  subscriber: Subscriber<Exclude<T, VOID>>
): () => void;

export function on<T>(signal: Signal<T>, listener: Listener<T>): () => void;

export function on(atomOrSignal: any, listener: any) {
  if (atomOrSignal.subscribe) return atomOrSignal.subscribe(listener, false);
  return addListener(atomOrSignal, listener);
}
