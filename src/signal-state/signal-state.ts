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
  observers: Array<Subscriber<T> | SignalState<any>>;
  subs: number;
  active: number;
  compute?: Computation<T>;
  filter?: Filter<T> | false;
  dependencies: Array<SignalState<any>>;
  depIndex: number;
  queueIndex?: number;
  isComputing?: boolean;
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
    compute,
    value,
    nextValue: value,
    subs: 0,
    active: 0,
    depIndex: -1,
    observers: [],
    dependencies: compute ? [] : (undefined as any),
  };

  if (parent) {
    if (!parent.children) parent.children = [state];
    else parent.children.push(state);
  }

  return state;
}

export function freeze(state: any) {
  const children = state.children;
  const value = state.value;

  for (let key in state) delete state[key];
  if (children) state.children = children;
  state.freezed = true;
  state.value = value;
}
