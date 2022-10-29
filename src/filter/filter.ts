export type Filter<T, I = T> = (value: T, prevValue: T | I) => any;
