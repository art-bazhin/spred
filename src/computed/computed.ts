import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { Computation, createSignalState } from '../signal-state/signal-state';
import { isWritableSignal } from '../guards/guards';
import { getStateValue } from '../core/core';
import { Filter } from '../filter/filter';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param shouldUpdate The function that returns a falsy value if the new signal value should be ignored. Use falsy arg value to emit signal values that are not equal to previous vaslue. Use truthy arg value to emit all signal values.
 * @returns Computed signal.
 */

export function computed<T>(compute: Computation<T>): Signal<T>;
export function computed<T>(
  compute: Computation<T>,
  shouldUpdate: boolean | null
): Signal<T>;
export function computed<T>(
  compute: Computation<T>,
  shouldUpdate: Filter<T>
): Signal<T | undefined>;

export function computed<T>(
  compute: Computation<T>,
  shouldUpdate?: any
): Signal<T> {
  const getValue = isWritableSignal(compute) ? () => compute() : compute;

  const state = createSignalState(undefined as any, getValue);
  const self: any = () => getStateValue(state);

  if (shouldUpdate !== undefined) state.filter = shouldUpdate;

  self._state = state;
  self.get = signalProto.get;
  self.subscribe = signalProto.subscribe;
  self.sample = signalProto.sample;

  return self;
}
