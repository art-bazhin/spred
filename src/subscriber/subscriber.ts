export type Subscriber<T> = (value: T, prevValue?: T) => any;
