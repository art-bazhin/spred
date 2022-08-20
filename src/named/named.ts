import { Signal } from '../signal/signal';

export function named<T>(signal: Signal<T>, name?: string | null | false) {
  (signal as any)._state.name = name;
  return signal;
}
