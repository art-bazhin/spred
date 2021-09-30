import { Subscriber } from './subscriber';

export interface State<T> {
  value: T;
  error?: Error;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  computedFn?: () => T;
  dependencies: State<any>[];
  dirtyCount: number;
  queueIndex: number;
  isProcessed: boolean;
}

export function createState<T>(value: T, computedFn?: () => T): State<T> {
  const state: State<T> = {
    value,
    computedFn,
    subscribers: [],
    dependants: [],
    dependencies: [],
    dirtyCount: 0,
    queueIndex: -1,
    isProcessed: false
  };

  return state;
}