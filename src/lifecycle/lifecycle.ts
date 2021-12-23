import { on } from '../on/on';
import { Signal, _Signal } from '../signal-base/signal-base';
import { removeFromArray } from '../utils/removeFromArray';

function addListener<T>(
  atom: Signal<any>,
  lifecycleName: string,
  listener: (value: T) => any
) {
  const lifecycleMethods = (atom as any)._state.lifecycle;

  if (!lifecycleMethods[lifecycleName]) {
    lifecycleMethods[lifecycleName] = [];
  }

  const arr = lifecycleMethods[lifecycleName];

  if (arr.indexOf(listener) > -1) return;
  arr.push(listener);

  return () => removeFromArray(arr, listener);
}

/**
 * Subscribes the function to the atom activation signal. The signal is triggered at the first subscription or at the first activation of a dependent atom.
 * @param atom Atom.
 * @param listener Function that listens to the atom activation signal.
 * @returns Unsubscribe function.
 */
export function onActivate<T>(atom: Signal<T>, listener: (value: T) => any) {
  return addListener<T>(atom, 'activate', listener);
}

/**
 * Subscribes the function to the atom deactivation signal. The signal is triggered when there are no subscribers or active dependent atoms left.
 * @param atom Atom.
 * @param listener Function that listens to the atom deactivation signal.
 * @returns Unsubscribe function.
 */
export function onDeactivate<T>(atom: Signal<T>, listener: (value: T) => any) {
  return addListener<T>(atom, 'deactivate', listener);
}

/**
 * Subscribes the function to the atom update signal. The signal is triggered every time the atom value is updated.
 * @param atom Atom.
 * @param listener Function that listens to the atom update signal.
 * @returns Unsubscribe function.
 */
export function onUpdate<T>(
  atom: Signal<T>,
  listener: (change: { value: T; prevValue: T }) => any
) {
  return addListener<{ value: T; prevValue: T }>(atom, 'update', listener);
}

/**
 * Subscribes the function to the atom exception signal. The signal is triggered for every unhandled exception in the calculation of the atom value.
 * @param atom Atom.
 * @param listener Function that listens to the atom exception signal.
 * @returns Unsubscribe function.
 */
export function onException<T>(atom: Signal<T>, listener: (e: unknown) => any) {
  return addListener<T>(atom, 'exception', listener);
}

/**
 * Subscribes the function to the atom notification start signal. The signal is triggered before atom subscribers are notified.
 * @param atom Atom.
 * @param listener Function that listens to the atom notification start signal.
 * @returns Unsubscribe function.
 */
export function onNotifyStart<T>(atom: Signal<T>, listener: (value: T) => any) {
  return addListener<T>(atom, 'notifyStart', listener);
}

/**
 * Subscribes the function to the atom notification end signal. The signal is triggered after atom subscribers are notified.
 * @param atom Atom.
 * @param listener Function that listens to the atom notification start signal.
 * @returns Unsubscribe function.
 */
export function onNotifyEnd<T>(atom: Signal<T>, listener: (value: T) => any) {
  return addListener<T>(atom, 'notifyEnd', listener);
}
