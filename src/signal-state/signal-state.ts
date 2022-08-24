import { scope, tracking } from '../core/core';
import { Subscriber } from '../subscriber/subscriber';
import { FALSE_STATUS } from '../utils/constants';

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled: boolean) => T);

export interface SignalState<T> {
  value: T;
  nextValue?: T;
  hasException?: boolean;
  exception?: unknown;
  observers: Set<Subscriber<T> | SignalState<any>>;
  subsCount: number;
  compute?: Computation<T>;
  dependencies?: Set<SignalState<any>>;
  dirtyCount: number;
  queueIndex: number;
  isComputing?: boolean;
  isCached: { status?: boolean };
  isCatcher?: boolean;
  hasCycle?: boolean;
  oldDepsCount: number;
  children?: ((() => any) | SignalState<any>)[];
  name?: string;

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

export function createSignalState<T>(
  value: T,
  compute?: Computation<T>
): SignalState<T> {
  const parent = tracking || scope;

  const state: SignalState<T> = {
    value,
    compute,
    observers: new Set(),
    dirtyCount: 0,
    queueIndex: -1,
    subsCount: 0,
    oldDepsCount: 0,
    isCached: FALSE_STATUS,
  };

  if (compute) state.dependencies = new Set();
  else state.nextValue = value;

  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push(state);
  }

  return state;
}
