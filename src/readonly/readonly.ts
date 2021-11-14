import { computed, WritableAtom } from '../main';

export function readonly<T>(atom: WritableAtom<T>) {
  return computed(() => atom());
}
