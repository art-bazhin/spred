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
  _listeners: ((payload: T) => any)[];
  _name?: string;
  _start?: (payload: T) => any;
  _end?: (payload: T) => any;
}

function emit<T>(this: _Signal<T>, payload: T) {
  if (this._start) this._start(payload);

  for (let listener of this._listeners) {
    listener(payload);
  }

  if (this._end) this._end(payload);
}

export function makeSignal<T>(
  target: any,
  name?: string,
  original?: _Signal<T>
) {
  target._emit = emit;

  target._name = original ? original._name : name;
  target._listeners = original ? original._listeners : [];

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

export function noncallable<T>(callableSignal: CallableSignal<T>) {
  return makeSignal({}, '', callableSignal as any);
}

export function on<T>(signal: Signal<T>, listener: (payload: T) => any) {
  let listeners = (signal as _Signal<T>)._listeners;

  if (listeners.indexOf(listener) > -1) return;

  listeners.push(listener);
  return () => removeFromArray(listeners, listener);
}

export function onSignalStart<T>(signal: Signal<T>, fn?: (payload: T) => any) {
  (signal as _Signal<T>)._start = fn;
}

export function oSignalEnd<T>(signal: Signal<T>, fn?: (payload: T) => any) {
  (signal as _Signal<T>)._end = fn;
}
