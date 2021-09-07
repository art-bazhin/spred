import { Subject } from './subject';
import { Computed } from './computed';

export type Observable<T> = Subject<T> | Computed<T>;
