import { getStateValue, addSubscriber, removeSubscriber } from '../core/core';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { NOOP } from '../utils/functions';

/**
 * Basic reactive primitive.
 */
export interface Atom<T> {
  /**
   * Calculates and returns the current value of the atom.
   */
  (): T;

  /**
   * Calculates and returns the current value of the atom.
   */
  get(): T;

  /**
   * Returns the current value of the atom without calculation.
   */
  value(): T | undefined;

  /**
   * Subscribes the function to updates of the atom value.
   * @param subscriber A function that listens to updates.
   * @param exec Determines whether the function should be called immediately after subscription.
   * @returns Unsubscribe function.
   */
  subscribe<E extends boolean>(
    subscriber: true extends E ? Subscriber<T> : Subscriber<Exclude<T, void>>,
    exec: E
  ): () => void;

  /**
   * Subscribes the function to updates of the atom value and calls it immediately.
   * @param subscriber A function that listens to updates.
   * @returns Unsubscribe function.
   */
  subscribe(subscriber: Subscriber<T>): () => void;

  /**
   * Subscribes an empty function to the atom to put the atom in the active state.
   * @returns Unsubscribe function.
   */
  activate(): () => void;
}

export interface _Atom<T> extends Atom<T> {
  _state: State<T>;
}

export const atomProto = {
  get() {
    return getStateValue((this as any)._state);
  },

  subscribe(subscriber: any, exec = true) {
    addSubscriber(this as any, subscriber, exec);
    return () => removeSubscriber(this as any, subscriber);
  },

  activate() {
    return this.subscribe(NOOP);
  },

  value(this: _Atom<any>) {
    return this._state.value;
  },
};
