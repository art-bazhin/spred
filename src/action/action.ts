import { computed } from '../computed/computed';
import { signal } from '../signal/signal';

export function action<T>() {
  const actionSignal = signal<T>();

  function emit(payload: T) {
    if (payload === undefined) actionSignal({} as any);
    else actionSignal(payload);
  }

  return [
    computed(actionSignal),
    emit as unknown extends T ? () => void : (payload: T) => void,
  ] as const;
}
