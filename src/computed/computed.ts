import { Signal } from '../signal-base/signal-base';
import { signalProto } from '../signal-base/signal-base';
import { createState } from '../state/state';
import { isWritableSignal } from '../utils/isSignal';

/**
 * Creates an signal that automatically calculates its value from other signals
 * @param computedFn The function that calculates signal value and returns it.
 * @returns Computed signal.
 */
export function computed<T>(computedFn: (prevValue?: T) => T) {
  const f: any = function () {
    return f.get();
  };

  const fn = isWritableSignal(computedFn) ? () => computedFn() : computedFn;

  f._state = createState(undefined as any, fn);

  f.constructor = computed;
  f.get = signalProto.get;
  f.subscribe = signalProto.subscribe;
  f.value = signalProto.value;

  return f as Signal<T>;
}
