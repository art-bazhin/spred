import { Subscriber } from './subscriber';

export interface State<T> {
  value: T;
  error?: Error;
  totalSubscribers: number;
  subscribers: Set<Subscriber<T>>;
  dependants: Set<State<any>>;
  computedFn?: () => T;
  dependencies: Set<State<any>>;
  isDirty: boolean;
  dirtyCount: number;
}
