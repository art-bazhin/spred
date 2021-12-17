export type Subscriber<T> = (value: T, prevValue: T | undefined) => any;
