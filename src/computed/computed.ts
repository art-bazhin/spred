import { Signal } from '../signal/signal';
import { signalProto } from '../signal/signal';
import { createState } from '../state/state';
import { isWritableSignal } from '../guards/guards';
import { getStateValue } from '../core/core';

function computedSelf(this: any) {
  return getStateValue(this);
}

/**
 * Creates an signal that automatically calculates its value from other signals
 * @param computedFn The function that calculates signal value and returns it.
 * @returns Computed signal.
 */
export function createComputed<T>(computedFn: (prevValue?: T) => T): Signal<T> {
  const fn = isWritableSignal(computedFn) ? () => computedFn() : computedFn;
  const state = createState(undefined as any, fn);
  const computed: any = computedSelf.bind(state);

  computed._state = state;
  computed.constructor = createComputed;
  computed.get = signalProto.get;
  computed.subscribe = signalProto.subscribe;
  computed.sample = signalProto.sample;

  return computed;
}
