import { scope } from '../core/core';
import { Subscriber } from '../subscriber/subscriber';
import { FALSE_STATUS } from '../utils/constants';

export interface State<T> {
  value: T;
  nextValue?: T;
  isNotifying?: boolean;
  cachedValue?: T;
  hasException?: boolean;
  exception?: unknown;
  observers: Set<Subscriber<T> | State<any>>;
  subsCount: number;
  computedFn?: (prevValue: T | undefined) => T;
  dependencies: Set<State<any>>;
  dirtyCount: number;
  queueIndex: number;
  isComputing?: boolean;
  isCached: { status?: boolean };
  isCatcher?: boolean;
  hasCycle?: boolean;
  oldDepsCount: number;
  unsubs?: (() => any)[];

  // lifecycle:
  onActivate?: ((value: T) => any)[];
  onDeactivate?: ((value: T) => any)[];
  onUpdate?: ((change: { value: T; prevValue: T | undefined }) => any)[];
  onNotifyStart?: ((value: T) => any)[];
  onNotifyEnd?: ((value: T) => any)[];
  onException?: ((e: unknown) => any)[];
}

export function createState<T>(
  value: T,
  computedFn?: (curentValue: T | undefined) => T
): State<T> {
  return {
    value,
    computedFn,
    observers: new Set(),
    dependencies: new Set(),
    dirtyCount: 0,
    queueIndex: -1,
    subsCount: 0,
    oldDepsCount: 0,
    isCached: FALSE_STATUS,
  };
}
