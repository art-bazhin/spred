import { scope, tracking } from '../core/core';
import { Signal, _Signal } from '../signal/signal';
import { removeFromArray } from '../utils/removeFromArray';

function addListener<T>(
  signal: Signal<any>,
  lifecycleKey: string,
  listener: (value: T) => any
) {
  const state = (signal as any)._state;

  if (!state[lifecycleKey]) {
    state[lifecycleKey] = [];
  }

  const arr = state[lifecycleKey];

  if (arr.indexOf(listener) > -1) return;
  arr.push(listener);

  const unsub = () => removeFromArray(arr, listener);
  const parent = tracking || scope;

  if (parent) {
    parent.children.push(unsub);
  }

  return unsub;
}

/**
 * Subscribes the function to the signal activation signal. The signal is triggered at the first subscription or at the first activation of a dependent signal.
 * @param signal Signal.
 * @param listener Function that listens to the signal activation signal.
 * @returns Unsubscribe function.
 */
export function onActivate<T>(signal: Signal<T>, listener: (value: T) => any) {
  return addListener<T>(signal, 'onActivate', listener);
}

/**
 * Subscribes the function to the signal deactivation signal. The signal is triggered when there are no subscribers or active dependent signals left.
 * @param signal Signal.
 * @param listener Function that listens to the signal deactivation signal.
 * @returns Unsubscribe function.
 */
export function onDeactivate<T>(
  signal: Signal<T>,
  listener: (value: T) => any
) {
  return addListener<T>(signal, 'onDeactivate', listener);
}

/**
 * Subscribes the function to the signal update signal. The signal is triggered every time the signal value is updated.
 * @param signal Signal.
 * @param listener Function that listens to the signal update signal.
 * @returns Unsubscribe function.
 */
export function onUpdate<T>(
  signal: Signal<T>,
  listener: (change: { value: T; prevValue: T }) => any
) {
  return addListener<{ value: T; prevValue: T }>(signal, 'onUpdate', listener);
}

/**
 * Subscribes the function to the signal exception signal. The signal is triggered for every unhandled exception in the calculation of the signal value.
 * @param signal Signal.
 * @param listener Function that listens to the signal exception signal.
 * @returns Unsubscribe function.
 */
export function onException<T>(
  signal: Signal<T>,
  listener: (e: unknown) => any
) {
  return addListener<T>(signal, 'onException', listener);
}

/**
 * Subscribes the function to the signal notification start signal. The signal is triggered before signal subscribers are notified.
 * @param signal Signal.
 * @param listener Function that listens to the signal notification start signal.
 * @returns Unsubscribe function.
 */
export function onNotifyStart<T>(
  signal: Signal<T>,
  listener: (value: T) => any
) {
  return addListener<T>(signal, 'onNotifyStart', listener);
}

/**
 * Subscribes the function to the signal notification end signal. The signal is triggered after signal subscribers are notified.
 * @param signal Signal.
 * @param listener Function that listens to the signal notification start signal.
 * @returns Unsubscribe function.
 */
export function onNotifyEnd<T>(signal: Signal<T>, listener: (value: T) => any) {
  return addListener<T>(signal, 'onNotifyEnd', listener);
}
