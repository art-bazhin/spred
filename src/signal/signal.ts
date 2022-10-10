import {
  getStateValue,
  addSubscriber,
  removeSubscriber,
  tracking,
  scope,
} from '../core/core';
import { SignalState } from '../signal-state/signal-state';
import { Subscriber } from '../subscriber/subscriber';
import { NOOP_FN } from '../utils/constants';

/**
 * Basic reactive primitive.
 */
export interface Signal<T> {
  /**
   * Calculates and returns the current value of the signal.
   */
  (): T;

  /**
   * Calculates and returns the current value of the signal.
   */
  get(): T;

  /**
   * Returns the current value of the signal without dependency tracking.
   */
  sample(): T;

  /**
   * Subscribes the function to updates of the signal value.
   * @param subscriber A function that listens to updates.
   * @param exec Determines whether the function should be called immediately after subscription.
   * @returns Unsubscribe function.
   */
  subscribe<E extends boolean>(
    subscriber: true extends E ? Subscriber<T> : Subscriber<Exclude<T, void>>,
    exec: E
  ): () => void;

  /**
   * Subscribes the function to updates of the signal value and calls it immediately.
   * @param subscriber A function that listens to updates.
   * @returns Unsubscribe function.
   */
  subscribe(subscriber: Subscriber<T>): () => void;
}

export interface _Signal<T> extends Signal<T> {
  _state: SignalState<T>;
}

export const signalProto = {
  get() {
    return getStateValue((this as any)._state);
  },

  subscribe(subscriber: any, exec = true) {
    addSubscriber(this as any, subscriber, exec);

    if ((this as any)._state.freezed) return NOOP_FN;

    const unsub = () => removeSubscriber(this as any, subscriber);
    const parent = tracking || scope;

    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(unsub);
    }

    return unsub;
  },

  sample(this: _Signal<any>) {
    return getStateValue((this as any)._state, true);
  },
};
