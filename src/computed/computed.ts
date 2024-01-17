import { Computation, Signal, SignalOptions } from '../core/core';
import { VOID } from '../common/constants';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns Computed signal.
 */
export function computed<T>(
  compute: Computation<T>,
  options?: SignalOptions<Exclude<T, typeof VOID>>,
): Signal<Exclude<T, typeof VOID>> {
  return new (Signal as any)(undefined as any, compute, options);
}
