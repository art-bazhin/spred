import { Computation, Signal, SignalOptions } from '../core/core';

/**
 * Creates a signal that automatically calculates its value based on other signals.
 * @param compute A function that calculates the signal value and returns it.
 * @param options A signal options.
 * @returns A computed signal.
 */
export function computed<T>(
  compute: Computation<T>,
  options?: SignalOptions<T>,
): Signal<T> {
  return new (Signal as any)(compute, options);
}
