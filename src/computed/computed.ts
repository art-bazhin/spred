import { Computation, Signal, SignalOptions } from '../core/core';

/**
 * Creates a signal that automatically calculates its value from other signals.
 * @param compute The function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns Computed signal.
 */
export function computed<T>(
  compute: Computation<T>,
  options?: SignalOptions<T>,
): Signal<T> {
  return new (Signal as any)(compute, options);
}
