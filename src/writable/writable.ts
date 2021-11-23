import { Atom, atomProto, _Atom } from '../atom/atom';
import { config } from '../config/config';
import { update } from '../core/core';
import { Filter } from '../filter/filter';
import { createState } from '../state/state';

const writableAtomProto = {
  ...atomProto,

  set(this: _Atom<any>, value: any) {
    update(this, value);
    return value;
  },

  notify(this: _Atom<any>) {
    update(this);
  },
};

export interface WritableAtom<T> extends Atom<T> {
  (value: T): T;
  set(value: T): T;
  notify(): void;
}

export function writable<T>(
  value: T,
  filter?: null | false | undefined
): WritableAtom<T>;

export function writable<T>(
  value: T,
  filter: Filter<T>
): WritableAtom<T | undefined>;

export function writable<T>(value: T, filter = config.filter) {
  const f: any = function (value?: T) {
    if (!arguments.length) return f.get();
    return f.set(value as T);
  };

  const hasFilter = filter && filter !== config.filter;
  const initialValue = hasFilter ? (filter(value) ? value : undefined) : value;

  f._state = createState(initialValue, undefined, undefined, filter);

  f.constructor = writable;
  f.set = writableAtomProto.set;
  f.get = writableAtomProto.get;
  f.notify = writableAtomProto.notify;
  f.subscribe = writableAtomProto.subscribe;
  f.activate = writableAtomProto.activate;
  f.value = writableAtomProto.value;

  return f;
}
