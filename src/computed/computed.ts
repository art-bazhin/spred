import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { Computation, createSignalState } from '../signal-state/signal-state';
import { isWritableSignal } from '../guards/guards';
import { getStateValue } from '../core/core';
import { Comparator } from '../compartor/comparator';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param compare Function to check if the new value equals to the previous value.
 * @param handleException Exception handler.
 * @returns Computed signal.
 */
export function computed<T>(
  compute: Computation<T>,
  compare?: null | undefined,
  handleException?: (e: unknown, prevValue?: T) => T
): Signal<T>;

export function computed<T>(
  compute: Computation<T>,
  compare: Comparator<T, undefined>,
  handleException?: (e: unknown, prevValue?: T) => T
): Signal<T, undefined>;

export function computed<T>(
  compute: Computation<T>,
  compare?: any,
  handleException?: (e: unknown, prevValue?: T) => T
): Signal<T> {
  const getValue = isWritableSignal(compute) ? () => compute() : compute;

  const state = createSignalState(
    undefined as any,
    getValue,
    compare,
    handleException
  );
  const self: any = () => getStateValue(state);

  self._state = state;
  self.get = signalProto.get;
  self.subscribe = signalProto.subscribe;
  self.sample = signalProto.sample;

  return self;
}
