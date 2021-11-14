import { Observable } from '../observable/observable';
import { observableProto } from '../observable/observable';
import { createState } from '../state/state';

export function computed<T>(
  computedFn: (currentValue?: T) => T,
  handleException?: (e: unknown, currentValue?: T) => T
) {
  const f: any = function () {
    return f.get();
  };

  f._state = createState(undefined as any, computedFn, handleException);

  f.constructor = computed;
  f.get = observableProto.get;
  f.subscribe = observableProto.subscribe;

  return f as Observable<T>;
}
