import { Atom } from '../atom/atom';
import { atomProto } from '../atom/atom';
import { Filter } from '../filter/filter';
import { createState } from '../state/state';
import { VOID } from '../void/void';

/**
 * Creates an atom that automatically calculates its value from other atoms
 * @param computedFn The function that calculates atom value and returns it.
 * @param catchException A function that handles an exception thrown when calculating the atom and returns the new atom value.
 * @param shouldUpdate A function that takes the new and current atom value, and returns true if the atom value needs to be updated.
 * @returns Computed atom.
 */
export function computed<T>(
  computedFn: (currentValue: T | VOID) => T,
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
