import { Atom, atomProto, _Atom } from '../atom/atom';
import { update } from '../core/core';
import { Filter } from '../filter/filter';
import { createState } from '../state/state';

const writableAtomProto = {
  ...atomProto,

  set(this: _Atom<any>, value: any) {
    update(this, value);
  },

  notify(this: _Atom<any>) {
    update(this);
  },
};

export interface WritableAtom<T> extends Atom<T> {
  (value: T): void;
  set(value: T): void;
  value(): T;
  notify(): void;
}

export function writable<T>(value: T, shouldUpdate?: Filter<T>) {
  const f: any = function (value?: T) {
    if (!arguments.length) return f.get();
    return f.set(value as T);
  };

  f._state = createState(value, undefined, undefined, shouldUpdate);

  f.constructor = writable;
  f.set = writableAtomProto.set;
  f.get = writableAtomProto.get;
  f.notify = writableAtomProto.notify;
  f.subscribe = writableAtomProto.subscribe;
  f.activate = writableAtomProto.activate;
  f.value = writableAtomProto.value;

  return f as WritableAtom<T>;
}
