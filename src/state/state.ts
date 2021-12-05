import { config } from '../config/config';
import { Filter } from '../filter/filter';
import { SignalResult } from '../signal/signal';
import { Subscriber } from '../subscriber/subscriber';
import { FALSE } from '../utils/functions';

export interface State<T> {
  value: T;
  prevValue?: T;
  cachedValue?: T;
  hasException: boolean;
  receivedException: boolean;
  exception?: unknown;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  activeCount: number;
  computedFn?: (currentValue?: T) => T;
  catch?: null | ((e: unknown, currentValue?: T) => T);
  filter: Filter<T>;
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
    activate?: SignalResult<T>;
    deactivate?: SignalResult<T>;
    update?: SignalResult<{ value: T; prevValue: T | undefined }>;
    notifyStart?: SignalResult<T>;
    notifyEnd?: SignalResult<T>;
    exception?: SignalResult<unknown>;
  };
}

export function createState<T>(
  value: T,
  computedFn?: (cuurentValue?: T) => T,
  catchException?: ((e: unknown, cuurentValue?: T) => T) | null,
  filter?: undefined | null | false | Filter<T>
): State<T> {
  return {
    value,
    computedFn,
    catch: catchException,
    filter: filter || config.shouldUpdate,
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
