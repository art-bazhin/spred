import { scope, tracking } from '../core/core';
import { Subscriber } from '../subscriber/subscriber';
import { FALSE_STATUS } from '../utils/constants';

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled: boolean) => T);

export interface State<T> {
  value: T;
  nextValue?: T;
  hasException?: boolean;
  exception?: unknown;
  observers: Set<Subscriber<T> | State<any>>;
  subsCount: number;
  compute?: Computation<T>;
  dependencies?: Set<State<any>>;
  dirtyCount: number;
  queueIndex: number;
  isComputing?: boolean;
  isCached: { status?: boolean };
  isCatcher?: boolean;
  hasCycle?: boolean;
  oldDepsCount: number;
  children?: ((() => any) | State<any>)[];
  lcUnsubs?: (() => any)[];
  name?: string;

  // lifecycle:
  onActivate?: ((value: T) => any)[];
  onDeactivate?: ((value: T) => any)[];
  onUpdate?: ((change: { value: T; prevValue: T | undefined }) => any)[];
  onNotifyStart?: ((value: T) => any)[];
  onNotifyEnd?: ((value: T) => any)[];
  onException?: ((e: unknown) => any)[];
}

export function createState<T>(value: T, compute?: Computation<T>): State<T> {
  const parent = tracking || scope;

  const state: State<T> = {
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
