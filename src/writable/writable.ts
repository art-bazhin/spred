import { Atom, AtomOptions, atomProto, _Atom } from '../atom/atom';
import { update } from '../core/core';
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

export function writable<T>(value: T, options?: AtomOptions<T>) {
  const f: any = function (value?: T) {
    if (!arguments.length) return f.get();
    return f.set(value as T);
  };

  f._state = createState(value, undefined, options);

  f.constructor = writable;
  f.set = writableAtomProto.set;
  f.get = writableAtomProto.get;
  f.notify = writableAtomProto.notify;
  f.subscribe = writableAtomProto.subscribe;

  return f as WritableAtom<T>;
}
