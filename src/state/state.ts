import { Subscriber } from '../subscriber/subscriber';
import { FALSE } from '../utils/functions';

export interface State<T> {
  value: T;
  prevValue: T | undefined;
  nextValue?: T;
  isNotifying?: boolean;
  cachedValue?: T;
  hasException: boolean;
  receivedException: boolean;
  exception?: unknown;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  activeCount: number;
  computedFn?: (currentValue: T | undefined) => T;
  catch?: null | ((e: unknown, currentValue?: T) => T);
  dependencies: State<any>[];
  dependencyStatuses: number[];
  dependencyStatusesSum: number;
  oldDependencies: State<any>[];
  dirtyCount: number;
  queueIndex: number;
  isComputing: boolean;
  isCached: () => boolean;
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
  computedFn?: (curentValue: T | undefined) => T,
  catchException?: ((e: unknown, cuurentValue?: T) => T) | null
): State<T> {
  return {
    value,
    prevValue: undefined,
    computedFn,
    catch: catchException,
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
    lifecycle: {},
  };
}
