export type Filter<T> = false | ((value: T, prevValue?: T) => any);
