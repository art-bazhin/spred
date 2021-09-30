import { Observable, observableProto } from './observable';
import {
  createState,
  setValues,
  STATE_KEY
} from './core';

const subjectProto = {
  ...observableProto,
  set(value: any) {
    setValues([this as any,  value]);
  }
}

export interface Subject<T> extends Observable<T> {
  set(value: T): void;
}

export function createSubject<T>(value: T) {
  const f = function (value?: T) {
    if (value === undefined) return f.get();
    f.set(value);
  } as Subject<T>;

  (f as any)[STATE_KEY] = createState(value);
  (f as any).__proto__ = subjectProto;

  return f;
}
