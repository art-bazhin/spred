import { Atom } from '../atom/atom';
import { Subscriber } from '../subscriber/subscriber';

export function on<T>(signal: Atom<T>, listener: Subscriber<T>) {
  return signal.subscribe(listener, false);
}
