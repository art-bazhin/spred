export type Listener<T> = (payload: Exclude<T, void>) => any;
