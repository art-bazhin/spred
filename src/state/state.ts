import { _Signal } from '../signal/signal';
import { Subscriber } from '../subscriber/subscriber';
import { FALSE } from '../utils/functions';

export interface State<T> {
  value: T;
  prevValue?: T;
  hasException: boolean;
  receivedException: boolean;
  exception?: unknown;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  activeCount: number; // subscribers and dependants length
  computedFn?: (currentValue?: T) => T;
  handleException?: (e: unknown, currentValue?: T) => T;
  dependencies: State<any>[];
  dependencyStatuses: number[];
  dependencyStatusesSum: number;
  oldDependencies: State<any>[];
  dirtyCount: number;
  queueIndex: number;
  isComputing: boolean;
  isCached: () => boolean;
  hasCycle: boolean;
  signals: {
    activate?: _Signal<T>;
    deactivate?: _Signal<T>;
    change?: _Signal<{ value: T; prevValue: T }>;
    notifyStart?: _Signal<T>;
    notifyEnd?: _Signal<T>;
    exception?: _Signal<unknown>;
  };
}

export function createState<T>(
  value: T,
  computedFn?: () => T,
  handleException?: (e: unknown, currentValue?: T) => T
): State<T> {
  return {
    value,
    computedFn,
    handleException,
    hasException: false,
    receivedException: false,
    subscribers: [],
    dependants: [],
    dependencies: [],
    dependencyStatuses: [],
    dependencyStatusesSum: 0,
    oldDependencies: [],
    dirtyCount: 0,
    queueIndex: -1,
    activeCount: 0,
    isComputing: false,
    hasCycle: false,
    isCached: FALSE,
    signals: {},
  };
}
