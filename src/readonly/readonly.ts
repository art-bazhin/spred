import { computed } from '../computed/computed';
import { TRUE } from '../utils/functions';
import { WritableAtom } from '../writable/writable';

/**
 * Creates a readonly copy of the writable atom.
 * @param atom Source atom.
 */
export function readonly<T>(atom: WritableAtom<T>) {
  return computed(() => atom(), null, TRUE);
}
