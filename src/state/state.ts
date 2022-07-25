import { Subscriber } from '../subscriber/subscriber';
import { FALSE_STATUS } from '../utils/constants';

export interface State<T> {
  value: T;
  nextValue?: T;
  isNotifying?: boolean;
  cachedValue?: T;
  hasException?: boolean;
  exception?: unknown;
  subscribers: Set<Subscriber<T>>;
  dependants: Set<State<any>>;
  activeCount: number;
  computedFn?: (prevValue: T | undefined) => T;
  dependencies: Set<State<any>>;
  dirtyCount: number;
  queueIndex: number;
  isComputing?: boolean;
  isCached: { status?: boolean };
  isCatcher?: boolean;
  hasCycle?: boolean;
  oldDepsCount: number;

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
    subscribers: new Set(),
    dependants: new Set(),
    dependencies: new Set(),
    dirtyCount: 0,
    queueIndex: -1,
    activeCount: 0,
    oldDepsCount: 0,
    isCached: FALSE_STATUS,
  };
}
