import { Atom } from '../atom/atom';
import { atomProto } from '../atom/atom';
import { config } from '../config/config';
import { Filter } from '../filter/filter';
import { createState } from '../state/state';
import { NULL } from '../utils/constants';

export function computed<T, E = T>(
  computedFn: (currentValue?: T) => T,
  catchException?: null | ((e: unknown) => E)
): Atom<T | E>;

export function computed<T, E = T>(
  computedFn: (currentValue?: T) => T,
  catchException?: null | false | ((e: unknown) => E),
  filter?: null | false | undefined
): Atom<T | E>;

export function computed<T, E = T>(
  computedFn: (currentValue?: T) => T,
  catchException?: null | false | ((e: unknown) => E),
  filter?: Filter<T>
): Atom<T | E | typeof NULL>;

export function computed(
  computedFn: any,
  catchException?: any,
  filter = config.filter
) {
  const f: any = function () {
    return f.get();
  };

  f._state = createState(NULL as any, computedFn, catchException, filter);

  f.constructor = computed;
  f.get = atomProto.get;
  f.subscribe = atomProto.subscribe;
  f.activate = atomProto.activate;
  f.value = atomProto.value;

  return f;
}
