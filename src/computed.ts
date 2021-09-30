import { Observable } from './observable';
import {
  createState,
  STATE_KEY
} from './core';
import { observableProto } from './observable';

export function createComputed<T>(computedFn: () => T) {
  const f = function () {
    return f.get();
  } as Observable<T>;

  (f as any)[STATE_KEY] = createState(undefined, computedFn);
  (f as any).__proto__ = observableProto;

  return f;
}
