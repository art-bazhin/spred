import { Observable } from '../../dist/spred';
import { Subscriber } from '../subscriber/subscriber';

export const STATE_KEY = '__spredState__';

export interface State<T> {
  value: T;
  error?: Error;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  active: number; // subscribers and dependants length
  computedFn?: () => T;
  dependencies: State<any>[];
  dc: number[];
  oldDependencies: State<any>[];
  dirtyCount: number;
  queueIndex: number;
  isProcessed: boolean;
}

export function createState<T>(value: T, computedFn?: () => T): State<T> {
  return {
    value,
    computedFn,
    subscribers: [],
    dependants: [],
    dependencies: [],
    dc: [],
    oldDependencies: [],
    dirtyCount: 0,
    queueIndex: -1,
    active: 0,
    isProcessed: false
  };
}

export function getState<T>(observable: Observable<T>): State<T> {
  return (observable as any)[STATE_KEY];
}