import { Atom, AtomConfig } from '../atom/atom';
import { atomProto } from '../atom/atom';
import { createState } from '../state/state';

export function computed<T>(
  computedFn: (currentValue?: T) => T,
  atomConfig?: AtomConfig<T>
) {
  const f: any = function () {
    return f.get();
  };

  f._state = createState(undefined as any, computedFn, atomConfig);

  f.constructor = computed;
  f.get = atomProto.get;
  f.subscribe = atomProto.subscribe;

  return f as Atom<T>;
}
