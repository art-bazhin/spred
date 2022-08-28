import { StateTypeError } from '../errors/errors';
import { onUpdate } from '../lifecycle/lifecycle';
import { memo } from '../memo/memo';
import { Signal } from '../signal/signal';
import { writable, WritableSignal } from '../writable/writable';

type Keys<T> = keyof T & (string | number);

type Select<T, K extends Keys<T>> = undefined extends T[K]
  ? Exclude<T[K], undefined> | null
  : T[K];

export interface Store<T> extends Signal<T> {
  replace(nextState: T): void;
  replace<K extends Keys<T>>(key: K, nextState: Select<T, K>): void;
  produce(updateFn: (state: T) => T | void): void;
  produce<K extends Keys<T>>(
    key: K,
    updateFn: (state: Select<T, K>) => Select<T, K> | void
  ): void;
  select<K extends Keys<T>>(key: K): Store<Select<T, K>>;
}

const STOP: any = {};
const STORES_CACHE: any = {};
let VALUES_CACHE: any = {};

let counter = 1;

function isPlainObject(obj: any) {
  const proto = Object.getPrototypeOf(obj);
  return proto && proto.constructor === Object;
}

function isArray(obj: any) {
  return Array.isArray(obj);
}

function copy<T>(obj: T): T {
  if (isArray(obj)) return (obj as any).slice();

  if (obj && typeof obj === 'object') {
    if (isPlainObject(obj)) return Object.assign({}, obj);
    throw new StateTypeError();
  }

  return obj;
}

function getClone<T>(id: string, state?: Signal<T>, value?: T): T {
  const cached = VALUES_CACHE[id];

  if (cached !== undefined) return cached;
  return copy(value || state!.sample());
}

function clearValuesCache() {
  VALUES_CACHE = {};
}

function replace<T>(this: Store<T>, arg1: any, arg2: any) {
  let nextState: T;

  if (arguments.length === 2) {
    replaceChild(this, arg1, arg2);
    return;
  } else {
    nextState = arg1;
  }

  VALUES_CACHE[(this as any)._id] = nextState;

  const setter = (this as any)._setter;

  if (setter) {
    setter(nextState);
    return;
  }

  (this as any)._parent.produce((parentValue: any) => {
    parentValue[(this as any)._key] = nextState;
  });
}

function produce<T>(this: Store<T>, arg1: any, arg2: any) {
  let updateFn: (state: T) => T | void;

  if (arguments.length === 2) {
    produceChild(this, arg1, arg2);
    return;
  } else {
    updateFn = arg1;
  }

  const setter = (this as any)._setter as WritableSignal<T> | undefined;
  const id = (this as any)._id;
  const key = (this as any)._key;
  const parent = (this as any)._parent;

  const clone = getClone(id, this);
  const next = updateFn(clone);

  if (next === STOP) return;

  const value = next === undefined ? clone : next;
  VALUES_CACHE[id] = value;

  if (setter) {
    setter(value);
    return;
  }

  parent.produce((parentValue: any) => {
    if (!parentValue) return STOP;
    parentValue[key] = value;
  });
}

function replaceChild<T, K extends Keys<T>>(self: Store<T>, key: K, arg: any) {
  self.produce((state) => {
    if (!state) return STOP;
    state[key] = arg;
  });
}

function produceChild<T, K extends Keys<T>>(self: Store<T>, key: K, arg: any) {
  self.produce((state) => {
    if (!state) return STOP;

    const id = (self as any)._id + '.' + key;
    const clone = getClone(id, undefined, state[key]);
    const next = arg(clone);
    const value = next === undefined ? clone : next;

    VALUES_CACHE[id] = value;
    state[key] = value;
  });
}

function select<T, K extends Keys<T>>(
  this: Store<T>,
  key: K
): Store<Select<T, K>> {
  const id = (this as any)._id + '.' + key;
  const cached = STORES_CACHE[id];

  if (cached) return cached;

  const store = memo(() => {
    const parentValue = this();
    const value = parentValue && parentValue[key];

    if (value === undefined) return null;
    return value;
  }) as any;

  store._id = id;
  store._key = key;
  store._parent = this;
  store.select = select;
  store.replace = replace;
  store.produce = produce;

  STORES_CACHE[id] = store;
  store._state.$d = () => delete STORES_CACHE[id];

  return store;
}

export function store<T>(initialState: T): Store<T> {
  const id = 'store' + counter++;
  const setter = writable(initialState);
  const store = memo(setter) as any;

  store._setter = setter;
  store._id = id;
  store.select = select;
  store.replace = replace;
  store.produce = produce;

  onUpdate(setter, clearValuesCache);

  return store as Store<T>;
}
