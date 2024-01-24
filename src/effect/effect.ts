import { computed } from '../computed/computed';
import { NOOP_FN } from '../common/constants';
import { SignalOptions } from '../core/core';

/**
 * Call the passed function immediately and every time the signals it depends on are updated.
 * @param fn A function to watch for
 * @param options Effect options.
 * @returns Stop watching function.
 */
export function effect<T>(fn: () => T, options?: SignalOptions<T>): () => void {
  return computed(fn, options).subscribe(NOOP_FN);
}
