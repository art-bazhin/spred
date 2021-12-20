import { writable } from '../writable/writable';
import { Atom } from '../atom/atom';
import { readonly } from '../readonly/readonly';
import { TRUE } from '../utils/functions';

export type SignalResult<T> = unknown extends T
  ? [Atom<T>, (payload?: T) => void]
  : [Atom<T>, (payload: T) => void];

/**
 * Creates a tuple from readonly atom representing an event and the event trigger function.
 * @returns Tuple from readonly atom representing an event and the event trigger function.
 */
export function signal<T>() {
  const source = writable<T | undefined>(undefined, TRUE);
  const atom = readonly(source);

  return [
    atom,
    function (payload: T) {
      if (!arguments.length) source({} as any);
      else source(payload);
    },
  ] as SignalResult<T>;
}
