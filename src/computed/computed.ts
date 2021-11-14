import { Atom } from '../atom/atom';
import { atomProto } from '../atom/atom';
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
  f.get = atomProto.get;
  f.subscribe = atomProto.subscribe;

  return f as Atom<T>;
}
