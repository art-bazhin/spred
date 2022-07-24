import { createWritable, WritableSignal } from '../writable/writable';
import { Signal, _Signal } from '../signal/signal';
import { createComputed } from '../computed/computed';
import { batch, update } from '../core/core';

export interface StoreOptions<T> {
  getItemId: (item: T) => string;
}

export interface StoreData<T> {
  [id: string]: T | null;
}

/**
 * Reactive object store.
 */
export interface Store<T> {
  /**
   * Returnes the item signal by id. Returns the same signal for the same id.
   * @param id Unique item id.
   */
  getSignal(id: string): Signal<T | null>;

  /**
   * Returnes the item by id. The returned value will be tracked when used in computed signals.
   * @param id Unique item id.
   */
  get(id: string): T | null;

  /**
   * Updates the item in the store.
   * @param item Item.
   */
  set(item: T): void;

  /**
   * Updates items in the store.
   * @param items Array of items.
   */
  set(items: T[]): void;

  /**
   * Deletes item from the store.
   * @param id  Unique item id.
   */
  delete(id: string): void;

  /**
   * Deletes items from the store.
   * @param ids  Array of unique item ids.
   */
  delete(ids: string[]): void;

  /**
   * Clears the store.
   */
  clear(): void;

  /**
   * signal that receives the store data every time it is updated. Useful for synchronizing with external storage.
   */
  data: Signal<StoreData<T>>;
}

interface _Store<T> extends Store<T> {
  _options: Partial<StoreOptions<T>>;
  _idFn: (item: T) => string;
  _data: WritableSignal<StoreData<T>>;
  _force: WritableSignal<null>;
  _signals: {
    [id: string]: Signal<T | null> | undefined;
  };
}

const DEFAULT_STORE_OPTIONS = {
  getItemId: (item: any) => item.id,
};

function createData<T>(items: T[], getItemId: (item: T) => string) {
  const data: StoreData<T> = {};

  if (!items) return data;

  for (let item of items) {
    data[getItemId(item)] = item;
  }

  return data;
}

function getSignal<T>(this: _Store<T>, id: string) {
  if (!this._signals[id]) {
    this._signals[id] = createComputed<T | null>(
      () => this._data()[id] || this._force()
    ) as any;
  }

  return this._signals[id]!;
}

function get<T>(this: _Store<T>, id: string) {
  return this.getSignal(id)();
}

function set<T>(this: _Store<T>, item: T): void;
function set<T>(this: _Store<T>, items: T[]): void;
function set<T>(this: _Store<T>, items: any) {
  const itemArr = Array.isArray(items) ? items : [items];
  const data = this._data.sample();

  batch(() => {
    for (let item of itemArr) {
      const id = this._idFn(item);
      data[id] = item;

      const signal = this._signals[id];
      if (signal) update((signal as any)._state);
    }

    update((this.data as any)._state);
    update((this._force as any)._state);
  });
}

function remove<T>(this: _Store<T>, id: string): void;
function remove<T>(this: _Store<T>, ids: string[]): void;
function remove<T>(this: _Store<T>, ids: any) {
  const idArr = Array.isArray(ids) ? ids : [ids];
  const data = this._data.sample();

  batch(() => {
    for (let id of idArr) {
      const signal = this._signals[id];

      delete this._signals[id];
      delete data[id];

      if (signal) update((signal as any)._state);
    }

    update((this.data as any)._state);
  });
}

function clear<T>(this: _Store<T>) {
  this._data({});
  this._signals = {};
}

/**
 * Creates a store.
 * @param data Oject storing items by their id.
 * @param options Store options.
 * @returns Store.
 */
export function createStore<T extends { id: string }>(
  data?: StoreData<T>,
  options?: Partial<StoreOptions<T>>
): Store<T>;

/**
 * Creates a store.
 * @param items Array of items.
 * @param options Store options.
 */
export function createStore<T extends { id: string }>(
  items?: T[],
  options?: Partial<StoreOptions<T>>
): Store<T>;

/**
 * Creates a store.
 * @param data Oject storing items by their id.
 * @param options Store options.
 * @returns Store.
 */
export function createStore<T>(
  items: StoreData<T>,
  options: StoreOptions<T>
): Store<T>;

/**
 * Creates a store.
 * @param items Array of items.
 * @param options Store options.
 */
export function createStore<T>(items: T[], options: StoreOptions<T>): Store<T>;

export function createStore<T>(items?: any, options?: any) {
  const opts = Object.assign({}, DEFAULT_STORE_OPTIONS, options || {});
  const storeMap =
    (Array.isArray(items) ? createData(items, opts.getItemId) : items) || {};
  const _data = createWritable(storeMap);
  const data = createComputed(_data);

  const res: _Store<T> = {
    _options: opts,
    _idFn: opts.getItemId,
    _signals: {},
    _force: createWritable(null),
    _data,
    data,
    getSignal,
    get,
    set,
    clear,
    delete: remove,
  };

  return res as Store<T>;
}
