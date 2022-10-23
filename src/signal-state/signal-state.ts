import { scope, tracking } from '../core/core';
import { Filter } from '../filter/filter';
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
  subs: number;
  compute?: Computation<T>;
  filter?: Filter<T> | false;
  dependencies: Set<SignalState<any>>;
  queueIndex?: number;
  tracking: boolean;
  stale: boolean;
  isCatcher?: boolean;
  version?: number;
  children?: ((() => any) | SignalState<any>)[];
  name?: string;
  freezed?: boolean;
  forced?: boolean;

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
    subs: 0,
    observers: new Set(),
    stale: true,
    tracking: false,
    freezed: false,
  } as any;

  if (compute) {
    state.compute = compute;
    state.dependencies = new Set();
  } else {
    state.nextValue = value;
  }

  if (parent) {
    if (!parent.children) parent.children = [state];
    else parent.children.push(state);
  }

  return state;
}
