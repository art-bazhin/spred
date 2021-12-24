import { computed } from '../computed/computed';
import { writable } from '../writable/writable';

export function signal<T>() {
  const source = writable<T>();

  function emit(payload: T) {
    if (payload === undefined) source({} as any);
    else source(payload);
  }

  return [
    computed(source),
    emit as unknown extends T ? () => void : (payload: T) => void,
  ] as const;
}
