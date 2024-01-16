import { get, subscribe, Subscriber } from '../core/core';

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
   * Calculates and returns the current value of the signal.
   */
  get(trackDependency: boolean): T | I;

  /**
   * Subscribes the function to updates of the signal value.
   * @param subscriber A function that listens to updates.
   * @param exec Determines whether the function should be called immediately after subscription.
   * @returns Unsubscribe function.
   */
  subscribe<E extends boolean>(
    subscriber: true extends E ? Subscriber<T | I> : Subscriber<T>,
    exec: E,
  ): () => void;

  /**
   * Subscribes the function to updates of the signal value and calls it immediately.
   * @param subscriber A function that listens to updates.
   * @returns Unsubscribe function.
   */
  subscribe(subscriber: Subscriber<T | I>): () => void;
}

export const signalProto = {
  get(trackDependency = true) {
    return get((this as any)._state, trackDependency);
  },

  subscribe(subscriber: any, exec = true) {
    return subscribe((this as any)._state, subscriber, exec);
  },
};
