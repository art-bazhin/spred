import { writable, WritableAtom } from '../writable/writable';
import { Atom, _Atom } from '../atom/atom';
import { computed } from '../computed/computed';
import { commit } from '../core/core';
import { config } from '../config/config';
import { readonly } from '../readonly/readonly';

interface StoreOptions<T> {
  getItemId?: (item: T) => string;
  shouldUpdate?: (value: T | undefined, prevValue?: T | undefined) => boolean;
}

interface StoreOptionsWithId<T> extends StoreOptions<T> {
  getItemId: (item: T) => string;
}

interface StoreData<T> {
  [id: string]: T | undefined;
}

/**
 * Reactive object store.
 */
export interface Store<T> {
  /**
   * Returnes the item atom by id. Returns the same atom for the same id.
   * @param id Unique item id.
   */
  getAtom(id: string): Atom<T | undefined>;

  /**
   * Returnes the item by id. The returned value will be tracked when used in computed atoms.
   * @param id Unique item id.
   */
  get(id: string): T | undefined;

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
   * Atom that receives the store data every time it is updated. Useful for synchronizing with external storage.
   */
  data: Atom<StoreData<T>>;
}

interface _Store<T> extends Store<T> {
  _options: StoreOptions<T>;
  _idFn: (item: T) => string;
  _data: WritableAtom<StoreData<T>>;
  _force: WritableAtom<undefined>;
  _atoms: {
    [id: string]: Atom<T | undefined> | undefined;
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

function getAtom<T>(this: _Store<T>, id: string) {
  const shouldUpdate = !this._options.shouldUpdate
    ? config.shouldUpdate
    : this._options.shouldUpdate;

  if (!this._atoms[id]) {
    this._atoms[id] = computed<T | undefined>(
      () => this._data()[id] || this._force(),
      null,
      shouldUpdate
    ) as any;
  }

  return this._atoms[id]!;
}

function get<T>(this: _Store<T>, id: string) {
  return this.getAtom(id)();
}

function set<T>(this: _Store<T>, item: T): void;
function set<T>(this: _Store<T>, items: T[]): void;
function set<T>(this: _Store<T>, items: any) {
  const itemArr = Array.isArray(items) ? items : [items];
  const data = this._data.value();

  const atomsToUpdate: [Atom<any>][] = [];

  for (let item of itemArr) {
    const id = this._idFn(item);
    data[id] = item;

    const atom = this._atoms[id];
    if (atom) atomsToUpdate.push([atom]);
  }

  atomsToUpdate.push([this._force]);
  atomsToUpdate.push([this.data]);

  commit(atomsToUpdate);
}

function remove<T>(this: _Store<T>, id: string): void;
function remove<T>(this: _Store<T>, ids: string[]): void;
function remove<T>(this: _Store<T>, ids: any) {
  const idArr = Array.isArray(ids) ? ids : [ids];
  const data = this._data.value();

  const atomsToUpdate: [Atom<any>][] = [];

  for (let id of idArr) {
    const atom = this._atoms[id];

    delete this._atoms[id];
    delete data[id];

    if (atom) atomsToUpdate.push([atom]);
  }

  atomsToUpdate.push([this.data]);

  commit(atomsToUpdate);
}

function clear<T>(this: _Store<T>) {
  this._data({});
  this._atoms = {};
}

/**
 * Creates a store.
 * @param data Oject storing items by their id.
 * @param options Store options.
 * @returns Store.
 */
export function store<T extends { id: string }>(
  data?: StoreData<T>,
  options?: StoreOptions<T>
): Store<T>;

/**
 * Creates a store.
 * @param items Array of items.
 * @param options Store options.
 */
export function store<T extends { id: string }>(
  items?: T[],
  options?: StoreOptions<T>
): Store<T>;

/**
 * Creates a store.
 * @param data Oject storing items by their id.
 * @param options Store options.
 * @returns Store.
 */
export function store<T>(
  items: StoreData<T>,
  options: StoreOptionsWithId<T>
): Store<T>;

/**
 * Creates a store.
 * @param items Array of items.
 * @param options Store options.
 */
export function store<T>(items: T[], options: StoreOptionsWithId<T>): Store<T>;

export function store<T>(items?: any, options?: any) {
  const opts = Object.assign({}, DEFAULT_STORE_OPTIONS, options || {});
  const storeMap = Array.isArray(items)
    ? createData(items, opts.getItemId)
    : items;
  const _data = writable(storeMap);
  const data = readonly(_data);

  const res: _Store<T> = {
    _options: opts,
    _idFn: opts.getItemId,
    _atoms: {},
    _force: writable(undefined),
    _data,
    data,
    getAtom,
    get,
    set,
    clear,
    delete: remove,
  };

  return res as Store<T>;
}
