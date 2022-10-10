import { scope, tracking } from '../core/core';
import { Subscriber } from '../subscriber/subscriber';

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled?: boolean) => T);

export interface SignalState<T> {
  value: T;
  nextValue?: T;
  hasException?: boolean;
  exception?: unknown;
  observers: Set<Subscriber<T> | SignalState<any>>;
  subsCount: number;
  compute?: Computation<T>;
  dependencies: Array<SignalState<any>>;
  depIndex: number;
  dirtyCount: number;
  queueIndex: number;
  isComputing?: boolean;
  isCatcher?: boolean;
  hasCycle?: boolean;
  version: number;
  children?: ((() => any) | SignalState<any>)[];
  name?: string;
  freezed?: boolean;

  // internal lifecycle
  $d?: ((value: T) => any) | null; // deactivate

  // lifecycle:
  onActivate?: ((value: T) => any) | null;
  onDeactivate?: ((value: T) => any) | null;
  onUpdate?: ((change: { value: T; prevValue: T | undefined }) => any) | null;
  onNotifyStart?: ((value: T) => any) | null;
  onNotifyEnd?: ((value: T) => any) | null;
  onException?: ((e: unknown) => any) | null;
}

const EMPTY: any = [];

export function createSignalState<T>(
  value: T,
  compute?: Computation<T>
): SignalState<T> {
  const parent = tracking || scope;

  const state: SignalState<T> = {
    value,
    nextValue: value,
    compute,
    observers: new Set(),
    dependencies: compute ? [] : EMPTY,
    dirtyCount: 0,
    queueIndex: -1,
    subsCount: 0,
    version: -1,
    depIndex: -1,
  };

  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push(state);
  }

  return state;
}

export function freeze(state: any) {
  delete state.compute;
  delete state.observers;
  delete state.dependencies;
  delete state.dirtyCount;
  delete state.hasException;
  delete state.subsCount;
  delete state.isComputing;
  delete state.version;

  state.freezed = true;
}
