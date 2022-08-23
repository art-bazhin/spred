import { Signal } from '../signal/signal';

export function named<T, S extends Signal<T>>(
  signal: S,
  name?: string | null | false
) {
  (signal as any)._state.name = name;
  return signal;
}
