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
    return value;
  }
}

export interface Atom<T> extends Observable<T> {
  (value: T): T;
  set(value: T): T;
}

export function atom<T>(value: T) {
  const f = function (value?: T) {
    if (!arguments.length) return f.get();
    return f.set(value as T);
  } as Atom<T>;

  (f as any)[STATE_KEY] = createState(value);
  (f as any).constructor = atom;

  Object.setPrototypeOf(f, atomProto);

  return f;
}
