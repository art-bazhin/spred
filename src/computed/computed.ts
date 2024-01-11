import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { Computation, createSignalState } from '../core/core';
import { isWritableSignal } from '../guards/guards';
import { get } from '../core/core';
import { Comparator } from '../compartor/comparator';
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
  compare?: Comparator<T> | null | undefined,
  handleException?: (e: unknown, prevValue?: T) => T,
): Signal<Exclude<T, typeof VOID>, T extends typeof VOID ? undefined : T> {
  const getValue = isWritableSignal(compute) ? () => compute() : compute;

  const state = createSignalState(
    undefined as any,
    getValue,
    compare,
    handleException,
  );
  const self: any = () => get(state);

  self._state = state;
  self.get = signalProto.get;
  self.subscribe = signalProto.subscribe;
  self.sample = signalProto.sample;

  return self;
}
