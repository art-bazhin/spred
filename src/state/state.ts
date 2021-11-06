import { Observable } from '../../dist/spred';
import { Subscriber } from '../subscriber/subscriber';

export const STATE_KEY = '__spredState__';

export interface State<T> {
  value: T;
  prevValue?: T;
  error?: Error;
  incomingError?: Error;
  errorChanged: boolean;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  active: number; // subscribers and dependants length
  computedFn?: (currentValue?: T) => T;
  dependencies: State<any>[];
  dependencyStatuses: number[];
  dependencyStatusesSum: number;
  oldDependencies: State<any>[];
  dirtyCount: number;
  queueIndex: number;
  isProcessed: boolean;
}

export function createState<T>(value: T, computedFn?: () => T): State<T> {
  return {
    value,
    computedFn,
    errorChanged: false,
    subscribers: [],
    dependants: [],
    dependencies: [],
    dependencyStatuses: [],
    dependencyStatusesSum: 0,
    oldDependencies: [],
    dirtyCount: 0,
    queueIndex: -1,
    active: 0,
    isProcessed: false,
  };
}

export function getState<T>(observable: Observable<T>): State<T> {
  return (observable as any)[STATE_KEY];
}
