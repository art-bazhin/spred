import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { Computation, createState } from '../state/state';
import { isWritableSignal } from '../guards/guards';
import { getStateValue } from '../core/core';

function computedSelf(this: any) {
  return getStateValue(this);
}

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @returns Computed signal.
 */
export function computed<T>(compute: Computation<T>): Signal<T> {
  const getValue = isWritableSignal(compute) ? () => compute() : compute;

  const state = createState(undefined as any, getValue);
  const computed: any = computedSelf.bind(state);

  computed._state = state;
  computed.constructor = computed;
  computed.get = signalProto.get;
  computed.subscribe = signalProto.subscribe;
  computed.sample = signalProto.sample;

  return computed;
}
