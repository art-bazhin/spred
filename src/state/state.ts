import { Subscriber } from '../subscriber/subscriber';

export interface State<T> {
  value: T;
  error?: Error;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  active: number; // subscribers and dependants length
  computedFn?: () => T;
  dependencies: State<any>[];
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
    oldDependencies: [],
    dirtyCount: 0,
    queueIndex: -1,
    active: 0,
    isProcessed: false
  };
}