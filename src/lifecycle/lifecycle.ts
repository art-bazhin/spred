import { Signal, _Signal } from '../signal/signal';

export type LifecycleHookName =
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'NOTIFY_START'
  | 'NOTIFY_END'
  | 'UPDATE'
  | 'EXCEPTION';

/**
 * Sets the activate event listener. The event is emitted at the first subscription or at the first activation of a dependent signal.
 * @param signal Target signal.
 * @param listener Function that listens to the signal activation event.
 */
export function onActivate<T>(
  signal: Signal<T>,
  listener: ((value: T) => any) | null
) {
  (signal as any)._state.onActivate = listener;
}

/**
 * Sets the deactivate event listener. The event is emitted when there are no subscribers or active dependent signals left.
 * @param signal Target signal.
 * @param listener Function that listens to the signal deactivation event.
 */
export function onDeactivate<T>(
  signal: Signal<T>,
  listener: ((value: T) => any) | null
) {
  (signal as any)._state.onDeactivate = listener;
}

/**
 * Sets the update event listener. The event is emitted every time the signal value is updated.
 * @param signal Target signal.
 * @param listener Function that listens to the signal update event.
 */
export function onUpdate<T>(
  signal: Signal<T>,
  listener: ((change: { value: T; prevValue: T | undefined }) => any) | null
) {
  (signal as any)._state.onUpdate = listener;
}

/**
 * Sets the update exception handler. The event is emitted for every unhandled exception in the calculation of the signal value.
 * @param signal Target signal.
 * @param listener Function that listens to the signal exception event.
 */
export function onException<T>(
  signal: Signal<T>,
  listener: ((e: unknown) => any) | null
) {
  (signal as any)._state.onException = listener;
}
