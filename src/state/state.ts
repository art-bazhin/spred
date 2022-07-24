import { Subscriber } from '../subscriber/subscriber';
import { FALSE_STATUS } from '../utils/constants';

export interface State<T> {
  value: T;
  prevValue: T | undefined;
  nextValue?: T;
  isNotifying?: boolean;
  cachedValue?: T;
  hasException: boolean;
  exception?: unknown;
  subscribers: Set<Subscriber<T>>;
  dependants: Set<State<any>>;
  activeCount: number;
  computedFn?: (prevValue: T | undefined) => T;
  dependencies: Set<State<any>>;
  newDeps: Set<State<any>>;
  dirtyCount: number;
  queueIndex: number;
  isComputing: boolean;
  isCached: { status?: boolean };
  isCatcher?: boolean;
  hasCycle: boolean;
  lifecycle: {
    activate?: ((value: T) => any)[];
    deactivate?: ((value: T) => any)[];
    update?: ((change: { value: T; prevValue: T | undefined }) => any)[];
    notifyStart?: ((value: T) => any)[];
    notifyEnd?: ((value: T) => any)[];
    exception?: ((e: unknown) => any)[];
  };
}

export function createState<T>(
  value: T,
  computedFn?: (curentValue: T | undefined) => T
): State<T> {
  return {
    value,
    prevValue: undefined,
    computedFn,
    hasException: false,
    subscribers: new Set(),
    dependants: new Set(),
    dependencies: new Set(),
    newDeps: new Set(),
    dirtyCount: 0,
    queueIndex: -1,
    activeCount: 0,
    isComputing: false,
    hasCycle: false,
    isCached: FALSE_STATUS,
    lifecycle: {},
  };
}
