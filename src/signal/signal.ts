import { Atom } from '../atom/atom';
import { readonly } from '../readonly/readonly';
import { writable } from '../writable/writable';
import { TRUE } from '../utils/functions';

export type SignalResult<T, P = T> = unknown extends T
  ? [Atom<unknown>, (payload?: unknown) => void]
  : [Atom<T>, (payload: P) => void];

export function signal<T>(): SignalResult<T | undefined, T>;

export function signal<T>(initialValue: T): SignalResult<T>;

export function signal(initialValue?: any): any {
  const s = writable(initialValue, {
    filter: TRUE,
  });

  return [
    readonly(s),
    (payload: any) => {
      s(payload);
    },
  ];
}
