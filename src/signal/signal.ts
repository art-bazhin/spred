import { endEmitingSignal, startEmitingSignal } from '../core/core';
import { Listener } from '../listener/listener';
import { removeFromArray } from '../utils/removeFromArray';

/**
 * Event which can be listened using the {@link on} function
 */
export interface Signal<T> {
  /**
   * Creates a new signal from the original.
   * @param mapFn Function that maps the source signal payload to the target signal payload.
   */
  map<M>(mapFn: (payload: Exclude<T, void>) => M): Signal<Exclude<M, void>>;
}

export interface _Signal<T, P = undefined> extends Signal<T> {
  _parent?: _Signal<P>;
  _mapFn?: (payload: P) => T;
  _deactivate?: () => void;
  _listeners: Listener<T>[];
  _children: Listener<T>[];
}

export type SignalResult<T> = unknown extends T
  ? [Signal<T>, (payload?: T) => void]
  : [Signal<T>, (payload: T) => void];

function createSignal<T, P = undefined>(
  parent?: _Signal<P>,
  mapFn?: (payload: P) => T
): _Signal<T, P> {
  return {
    map,
    _parent: parent,
    _mapFn: mapFn,
    _listeners: [],
    _children: [],
  };
}

function map<T, M>(this: _Signal<T>, mapFn: (payload: T) => M) {
  return createSignal<Exclude<M, void>, T>(this, mapFn as any);
}

/**
 * Creates a tuple of signal and signal trigger function.
 * @returns Tuple of signal and signal trigger function.
 */
export function signal<T>() {
  const s = createSignal<T>();

  return [
    s,
    function (payload: T) {
      if (!arguments.length) emitSignal(s, null as any);
      else emitSignal(s, payload);
    },
  ] as SignalResult<T>;
}

export function addListener<T, P>(
  signal: _Signal<T, P>,
  listener: Listener<T>
) {
  const listeners = signal._listeners;
  const activate = signal._parent && signal._mapFn && !listeners.length;

  if (listeners.indexOf(listener) > -1) return;
  listeners.push(listener);

  if (activate) {
    const children = signal._parent!._children;
    const mapFn = signal._mapFn!;

    const parentListener = (payload: P) => {
      emitSignal(signal, mapFn(payload));
    };

    children.push(parentListener);

    signal._deactivate = () => {
      removeFromArray(children, parentListener);
      signal._deactivate = undefined;
    };
  }

  return () => {
    removeFromArray(listeners, listener);
    if (!listeners.length && signal._deactivate) signal._deactivate();
  };
}

function emitSignal<T>(signal: _Signal<T, any>, payload: T) {
  if (payload === undefined) return;

  startEmitingSignal();

  const emitListener = (listener: Listener<T>) => listener(payload as any);

  signal._listeners.forEach(emitListener);
  signal._children.forEach(emitListener);

  endEmitingSignal();
}
