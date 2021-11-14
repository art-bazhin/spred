import { computed } from '../computed/computed';
import { WritableAtom } from '../writable/writable';

export function readonly<T>(atom: WritableAtom<T>) {
  return computed(() => atom());
}
