import { VOID } from '../void/void';

export type Subscriber<T> = (value: T, prevValue: T | VOID) => any;
