import { computed } from '../computed/computed';
import { TRUE } from '../utils/functions';
import { WritableAtom } from '../writable/writable';

export function readonly<T>(atom: WritableAtom<T>) {
  return computed(() => atom(), {
    filter: TRUE,
  });
}
