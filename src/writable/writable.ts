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

/**
 * An atom whose value can be set.
 */
export interface WritableAtom<T> extends Atom<T> {
  /**
   * Sets the value of the atom
   * @param value New value of the atom.
   */
  (value: T): void;

  /**
   * Sets the value of the atom
   * @param value New value of the atom.
   */
  set(value: T): void;

  /**
   * Notify subscribers without setting a new value.
   */
  notify(): void;

  value(): T;
}

/**
 * Сreates a writable atom.
 * @param value Initial value of the atom.
 * @param shouldUpdate A function that takes the new and current atom value, and returns true if the atom value needs to be updated.
 * @returns Writable atom.
 */
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
