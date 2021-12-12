import { on } from '../on/on';
import { Atom, _Atom } from '../atom/atom';
import { signal, Signal } from '../signal/signal';

function getAtomSignal<T>(atom: Atom<any>, signalName: string) {
  const signals = (atom as any)._state.signals;
  if (!signals[signalName]) signals[signalName] = signal();
  return signals[signalName][0] as Signal<T>;
}

/**
 * Subscribes the function to the atom activation signal. The signal is triggered at the first subscription or at the first activation of a dependent atom.
 * @param atom Atom.
 * @param listener Function that listens to the atom activation signal.
 * @returns Unsubscribe function.
 */
export function onActivate<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal<T>(atom, 'activate'), listener);
}

/**
 * Subscribes the function to the atom deactivation signal. The signal is triggered when there are no subscribers or active dependent atoms left.
 * @param atom Atom.
 * @param listener Function that listens to the atom deactivation signal.
 * @returns Unsubscribe function.
 */
export function onDeactivate<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal<T>(atom, 'deactivate'), listener);
}

/**
 * Subscribes the function to the atom update signal. The signal is triggered every time the atom value is updated.
 * @param atom Atom.
 * @param listener Function that listens to the atom update signal.
 * @returns Unsubscribe function.
 */
export function onUpdate<T>(
  atom: Atom<T>,
  listener: (change: { value: T; prevValue: T }) => any
) {
  return on(
    getAtomSignal<{ value: T; prevValue: T }>(atom, 'update'),
    listener
  );
}

/**
 * Subscribes the function to the atom exception signal. The signal is triggered for every unhandled exception in the calculation of the atom value.
 * @param atom Atom.
 * @param listener Function that listens to the atom exception signal.
 * @returns Unsubscribe function.
 */
export function onException<T>(atom: Atom<T>, listener: (e: unknown) => any) {
  return on(getAtomSignal(atom, 'exception'), listener);
}

/**
 * Subscribes the function to the atom notification start signal. The signal is triggered before atom subscribers are notified.
 * @param atom Atom.
 * @param listener Function that listens to the atom notification start signal.
 * @returns Unsubscribe function.
 */
export function onNotifyStart<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal<T>(atom, 'notifyStart'), listener);
}

/**
 * Subscribes the function to the atom notification end signal. The signal is triggered after atom subscribers are notified.
 * @param atom Atom.
 * @param listener Function that listens to the atom notification start signal.
 * @returns Unsubscribe function.
 */
export function onNotifyEnd<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal<T>(atom, 'notifyEnd'), listener);
}
