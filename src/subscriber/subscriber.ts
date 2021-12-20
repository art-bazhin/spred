export type Subscriber<T> = (value: T, prevValue?: T, exec?: boolean) => any;
