import { Signal } from '../signal-base/signal-base';
import { signalProto } from '../signal-base/signal-base';
import { createState } from '../state/state';

/**
 * Creates an atom that automatically calculates its value from other atoms
 * @param computedFn The function that calculates atom value and returns it.
 * @param catchException A function that handles an exception thrown when calculating the atom and returns the new atom value.
 * @returns Computed atom.
 */
export function computed<T>(
  computedFn: (currentValue?: T) => T,
  catchException?: ((e: unknown, cuurentValue?: T) => T) | null
) {
  const f: any = function () {
    return f.get();
  };

  f._state = createState(undefined as any, computedFn, catchException);

  f.constructor = computed;
  f.get = signalProto.get;
  f.subscribe = signalProto.subscribe;
  f.activate = signalProto.activate;
  f.value = signalProto.value;

  return f as Signal<T>;
}
