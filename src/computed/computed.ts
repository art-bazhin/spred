import { Atom } from '../atom/atom';
import { atomProto } from '../atom/atom';
import { Filter } from '../filter/filter';
import { createState } from '../state/state';
import { VOID } from '../void/void';

export function computed<T>(
  computedFn: (currentValue?: T) => T,
  catchException?: ((e: unknown, cuurentValue?: T) => T) | null,
  shouldUpdate?: Filter<T>
) {
  const f: any = function () {
    return f.get();
  };

  f._state = createState(VOID as any, computedFn, catchException, shouldUpdate);

  f.constructor = computed;
  f.get = atomProto.get;
  f.subscribe = atomProto.subscribe;
  f.activate = atomProto.activate;
  f.value = atomProto.value;

  return f as Atom<T>;
}
