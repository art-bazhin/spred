import { Signal, signalProto, _Signal } from '../signal-base/signal-base';
import { update } from '../core/core';
import { createState } from '../state/state';

const writableSignalProto = {
  ...signalProto,

  set(this: _Signal<any>, value: any) {
    update(this, value);
  },

  notify(this: _Signal<any>) {
    update(this);
  },
};

/**
 * An atom whose value can be set.
 */
export interface WritableSignal<T> extends Signal<T> {
  /**
   * Sets the value of the atom
   * @param value New value of the atom.
   */
  (value: T): void;

  /**
   * Sets the value of the atom
   * @param value New value of the atom.
   */
  set(value: T): void;

  /**
   * Notify subscribers without setting a new value.
   */
  notify(): void;

  value(): T;
}

/**
 * Сreates a writable atom.
 * @returns Writable atom.
 */
export function signal<T>(): WritableSignal<T | undefined>;

/**
 * Сreates a writable atom.
 * @param value Initial value of the atom.
 * @returns Writable atom.
 */
export function signal<T>(value: T): WritableSignal<T>;

export function signal(value?: any) {
  const f: any = function (value?: any) {
    if (!arguments.length) return f.get();
    return f.set(value);
  };

  f._state = createState(value, undefined, undefined);

  f.constructor = signal;
  f.set = writableSignalProto.set;
  f.get = writableSignalProto.get;
  f.notify = writableSignalProto.notify;
  f.subscribe = writableSignalProto.subscribe;
  f.activate = writableSignalProto.activate;
  f.value = writableSignalProto.value;

  return f;
}
