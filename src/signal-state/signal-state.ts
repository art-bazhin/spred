import { scope, tracking } from '../core/core';
import { Filter } from '../filter/filter';
import { Subscriber } from '../subscriber/subscriber';

export interface ListNode {
  nt: ListNode | null;
  pt: ListNode | null;
  ns: ListNode | null;
  ps: ListNode | null;
  s: SignalState<any>;
  t: SignalState<any> | Subscriber<any>;
  stale: boolean;
  cached: number;
}

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled?: boolean) => T);

export interface SignalState<T> {
  value: T;
  nextValue?: T;
  hasException?: boolean;
  exception?: unknown;
  subs: number;
  compute?: Computation<T>;
  catch?: (err: unknown, prevValue?: T) => T;
  filter?: Filter<T> | false;
  i?: number;
  tracking: boolean;
  version?: any;
  children?: ((() => any) | SignalState<any>)[];
  name?: string;
  freezed?: boolean;
  forced?: boolean;

  fs: ListNode | null;
  ls: ListNode | null;
  ft: ListNode | null;
  lt: ListNode | null;
  node: ListNode | null;

  // lifecycle:
  onActivate?: ((value: T) => any) | null;
  onDeactivate?: ((value: T) => any) | null;
  onUpdate?: ((change: { value: T; prevValue: T | undefined }) => any) | null;
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
    nextValue: value,
    subs: 0,
    i: 0,
    tracking: false,
    version: null,
    node: null,
    fs: null,
    ls: null,
    ft: null,
    lt: null,
  };

  if (parent) {
    if (!parent.children) parent.children = [state];
    else parent.children.push(state);
  }

  return state;
}
