import { getStateValue, subscribe } from '../core/core';
import { SignalState } from '../signal-state/signal-state';
import { Subscriber } from '../subscriber/subscriber';

/**
 * Basic reactive primitive.
 */
export interface Signal<T, I = T> {
  /**
   * Calculates and returns the current value of the signal.
   */
  (): T | I;

  /**
   * Calculates and returns the current value of the signal.
   */
  get(): T | I;

  /**
   * Returns the current value of the signal without dependency tracking.
   */
  sample(): T | I;

  /**
   * Subscribes the function to updates of the signal value.
   * @param subscriber A function that listens to updates.
   * @param exec Determines whether the function should be called immediately after subscription.
   * @returns Unsubscribe function.
   */
  subscribe<E extends boolean>(
    subscriber: true extends E ? Subscriber<T | I> : Subscriber<T>,
    exec: E
  ): () => void;

  /**
   * Subscribes the function to updates of the signal value and calls it immediately.
   * @param subscriber A function that listens to updates.
   * @returns Unsubscribe function.
   */
  subscribe(subscriber: Subscriber<T | I>): () => void;
}

export const signalProto = {
  get() {
    return getStateValue((this as any)._state);
  },

  subscribe,

  sample(this: Signal<any>) {
    return getStateValue((this as any)._state, true);
  },
};
