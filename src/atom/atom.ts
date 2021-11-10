import { Observable, observableProto } from '../observable/observable';
import { update } from '../core/core';
import { createState } from '../state/state';
import { makeSignal } from '../signal/signal';

const atomProto = {
  ...observableProto,
  set(value: any) {
    update(this as any, value);
    return value;
  },
};

export interface Atom<T> extends Observable<T> {
  (value: T): T;
  set(value: T): T;
}

export function atom<T>(value: T) {
  const f: any = function (value?: T) {
    if (!arguments.length) return f.get();
    return f.set(value as T);
  };

  f._state = createState(f, value);

  f.constructor = atom;
  f.set = atomProto.set;
  f.get = atomProto.get;
  f.subscribe = atomProto.subscribe;

  f.activated = makeSignal({}, 'ACTIVATED');
  f.deactivated = makeSignal({}, 'DEACTIVATED');
  f.exception = makeSignal({}, 'EXCEPTION');

  return f as Atom<T>;
}
