import { Observable } from './observable';
import {
  STATE_KEY
} from './core';
import { observableProto } from './observable';
import { createState } from './state';

export function computed<T>(computedFn: () => T) {
  const f = function () {
    return f.get();
  } as Observable<T>;

  (f as any)[STATE_KEY] = createState(undefined, computedFn);
  (f as any).constructor = computed;

  Object.setPrototypeOf(f, observableProto);

  return f;
}
