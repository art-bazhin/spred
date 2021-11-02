import { Observable, observableProto } from '../observable/observable';
import {
  update
} from '../core/core';
import { createState, STATE_KEY } from '../state/state';

const atomProto = {
  ...observableProto,
  set(value: any) {
    update(this as any,  value);
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
  (f as any).set = atomProto.set;
  (f as any).get = atomProto.get;
  (f as any).subscribe = atomProto.subscribe;

  return f;
}
