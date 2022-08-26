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
  update(nextState: T): void;
  update(updateFn: (state: T) => T | void): void;
  updateChild<K extends Keys<T>>(key: K, nextState: Select<T, K>): void;
  updateChild<K extends Keys<T>>(
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

function update<T>(this: Store<T>, arg: any) {
  const setter = (this as any)._setter as WritableSignal<T>;
  const id = (this as any)._id as string;

  if (typeof arg !== 'function') {
    setter(arg);
    return;
  }

  setter((current) => {
    const clone = getClone(id, this, current);
    const next = arg(clone);

    if (next === STOP) return;

    const value = next === undefined ? clone : next;
    VALUES_CACHE[id] = value;

    return value;
  });
}

function updateSelect<T>(this: Store<T>, arg: any) {
  const id = (this as any)._id;
  const key = (this as any)._key;
  const parent = (this as any)._parent;

  if (typeof arg !== 'function') {
    parent.update((parentValue: any) => {
      parentValue[key] = arg;
    });

    return;
  }

  const clone = getClone(id, this);
  const next = arg(clone);

  if (next === STOP) return;

  const value = next === undefined ? clone : next;
  VALUES_CACHE[id] = value;

  parent.update((parentValue: any) => {
    if (!parentValue) return STOP;
    parentValue[key] = value;
  });
}

function updateChild<T, K extends Keys<T>>(this: Store<T>, key: K, arg: any) {
  this.update((state) => {
    if (!state) return STOP;

    if (typeof arg !== 'function') {
      state[key] = arg;
      return;
    }

    const id = (this as any)._id + '.' + key;
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
  store.update = updateSelect;
  store.updateChild = updateChild;

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
  store.update = update;
  store.updateChild = updateChild;

  onUpdate(setter, clearValuesCache);

  return store as Store<T>;
}
