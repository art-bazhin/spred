import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { createState } from '../state/state';
import { isWritableSignal } from '../guards/guards';

/**
 * Creates an signal that automatically calculates its value from other signals
 * @param computedFn The function that calculates signal value and returns it.
 * @returns Computed signal.
 */
export function createComputed<T>(computedFn: (prevValue?: T) => T) {
  const f: any = function () {
    return f.get();
  };

  const fn = isWritableSignal(computedFn) ? () => computedFn() : computedFn;

  f._state = createState(undefined as any, fn);

  f.constructor = createComputed;
  f.get = signalProto.get;
  f.subscribe = signalProto.subscribe;
  f.sample = signalProto.sample;

  return f as Signal<T>;
}
