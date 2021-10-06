import { Subscriber } from './subscriber';

export interface State<T> {
  value: T;
  error?: Error;
  subscribers: Subscriber<T>[];
  dependants: State<any>[];
  computedFn?: () => T;
  dependencies: State<any>[];
  obsoleteDependencies: State<any>[];
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
    obsoleteDependencies: [],
    dirtyCount: 0,
    queueIndex: -1,
    isProcessed: false
  };
}