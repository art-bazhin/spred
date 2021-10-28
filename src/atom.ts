import { Observable, observableProto } from './observable';
import {
  commit,
  STATE_KEY
} from './core';
import { createState } from './state';

const atomProto = {
  __proto__: observableProto,
  set(value: any) {
    commit([this as any,  value]);
  }
}

export interface Atom<T> extends Observable<T> {
  set(value: T): void;
}

export function atom<T>(value: T) {
  const f = function (value?: T) {
    if (value === undefined) return f.get();
    f.set(value);
  } as Atom<T>;

  (f as any)[STATE_KEY] = createState(value);
  (f as any).__proto__ = atomProto;
  (f as any).constructor = atom;

  return f;
}
