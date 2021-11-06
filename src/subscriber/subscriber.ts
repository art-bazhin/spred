export type Subscriber<T> = (value: T, prevValue?: T, error?: Error) => any;
