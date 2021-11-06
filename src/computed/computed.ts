import { Observable } from '../observable/observable';
import { observableProto } from '../observable/observable';
import { createState, STATE_KEY } from '../state/state';

export function computed<T>(computedFn: (currentValue?: T) => T) {
  const f = function () {
    return f.get();
  } as Observable<T>;

  (f as any)[STATE_KEY] = createState(undefined, computedFn);
  (f as any).constructor = computed;
  (f as any).get = observableProto.get;
  (f as any).subscribe = observableProto.subscribe;

  return f;
}
