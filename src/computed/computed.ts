import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { Computation, createSignalState } from '../core/core';
import { get, EqualityFn } from '../core/core';
import { VOID } from '../utils/constants';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param compare Function to check if the new value equals to the previous value.
 * @param handleException Exception handler.
 * @returns Computed signal.
 */
export function computed<T>(
  compute: Computation<T>,
  compare?: EqualityFn<T> | null | undefined,
  handleException?: (e: unknown, prevValue?: T) => T,
): Signal<Exclude<T, typeof VOID>> {
  const state = createSignalState(
    undefined as any,
    compute,
    compare,
    handleException,
  );

  const self: any = function () {
    return get(state);
  };

  self._state = state;
  self.get = signalProto.get;
  self.subscribe = signalProto.subscribe;

  return self;
}
