import { removeFromArray } from '../utils/removeFromArray';

export interface Signal<T> {
  readonly ['']: T | undefined;
}

interface CallableSignal<T> extends Signal<T> {
  (payload: T): void;
}

interface VoidSignal extends Signal<unknown> {
  (): void;
}

export interface _Signal<T> extends Signal<T> {
  _emit(payload?: T): void;
  _listeners?: ((payload: T) => any)[];
  _name?: string;
}

interface _CallableSignal<T> extends CallableSignal<T>, _Signal<T> {}

function emit<T>(this: _Signal<T>, payload: T) {
  if (!this._listeners) return;
  for (const listener of this._listeners) {
    listener(payload);
  }
}

export function makeSignal<T>(target: any, name?: string) {
  target._emit = emit;
  target._name = name;

  return target as _Signal<T>;
}

export function signal<T>(name?: string) {
  const f: any = function (payload: T) {
    f._emit(payload);
  };

  return makeSignal(f, name) as any as void extends T
    ? VoidSignal
    : CallableSignal<T>;
}

export function on<T>(signal: Signal<T>, listener: (payload: T) => any) {
  let listeners = (signal as _Signal<T>)._listeners!;

  if (!listeners) {
    listeners = [] as ((payload: T) => any)[];
    (signal as _Signal<T>)._listeners = listeners;
  }

  if (listeners.indexOf(listener) > -1) return;

  listeners.push(listener);
  return () => removeFromArray(listeners, listener);
}
