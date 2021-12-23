import { computed } from '../computed/computed';
import { WritableSignal } from '../signal/signal';

/**
 * Creates a readonly copy of the writable atom.
 * @param atom Source atom.
 * @returns Readonly copy of the source atom.
 */
export function readonly<T>(signal: WritableSignal<T>) {
  return computed(() => signal());
}
