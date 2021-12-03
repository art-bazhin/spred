import { Atom } from '../atom/atom';
import { Subscriber } from '../subscriber/subscriber';
import { NULL } from '../utils/constants';

export function on<T>(
  signal: Atom<T>,
  listener: Subscriber<Exclude<T, typeof NULL>>
) {
  return signal.subscribe(listener, false);
}
