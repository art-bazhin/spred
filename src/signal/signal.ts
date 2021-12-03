import { NULL } from '../utils/constants';
import { Atom } from '../atom/atom';
import { readonly } from '../readonly/readonly';
import { writable } from '../writable/writable';

export type SignalResult<T, P = T> = unknown extends T
  ? [Atom<unknown>, (payload?: unknown) => void]
  : [Atom<T>, (payload: P) => void];

export function signal<T>() {
  const source = writable<T | NULL>(NULL, null);

  return [
    readonly(source),
    (payload: T) => {
      source(payload);
    },
  ] as const;
}
