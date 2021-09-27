import { Subscriber } from './subscriber';

export interface State<T> {
  value: T;
  error?: Error;
  subscribers: Set<Subscriber<T>>;
  dependants: Set<State<any>>;
  computedFn?: () => T;
  dependencies: Set<State<any>>;
  dirtyCount: number;
}
