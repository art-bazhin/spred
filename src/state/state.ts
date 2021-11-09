import { Observable } from '../main';
import { Subscriber } from '../subscriber/subscriber';

export const STATE_KEY = '__spredState__';

export const FALSE = () => false;

export interface State<T> {
  value: T;
  prevValue?: T;
  hasException: boolean;
  receivedException: boolean;
  exception?: any;
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
  };
}

export function getState<T>(observable: Observable<T>): State<T> {
  return (observable as any)[STATE_KEY];
}
