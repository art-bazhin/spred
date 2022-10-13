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
  observers?: Array<Subscriber<T> | SignalState<any>>;
  subsCount: number;
  obsCount: number;
  compute?: Computation<T>;
  dependencies?: Array<SignalState<any>>;
  depIndex: number;
  queueIndex?: number;
  isComputing?: boolean;
  isCatcher?: boolean;
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

export function createSignalState<T>(
  value: T,
  compute?: Computation<T>
): SignalState<T> {
  const parent = tracking || scope;

  const state: SignalState<T> = {
    value,
    nextValue: value,
    compute,
    subsCount: 0,
    obsCount: 0,
    version: -1,
    depIndex: -1,
  };

  if (parent) {
    if (!parent.children) parent.children = [state];
    else parent.children.push(state);
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
