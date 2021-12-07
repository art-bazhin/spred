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

export interface Store<T> {
  getAtom(id: string): Atom<T | undefined>;
  get(id: string): T | undefined;
  set(item: T): void;
  set(items: T[]): void;
  delete(id: string): void;
  delete(ids: string[]): void;
  clear(): void;
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
  const data = this._data();

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
  const data = this._data();

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

export function store<T extends { id: string }>(
  items?: StoreData<T>,
  options?: StoreOptions<T>
): Store<T>;

export function store<T extends { id: string }>(
  items?: T[],
  options?: StoreOptions<T>
): Store<T>;

export function store<T>(
  items: StoreData<T>,
  options: StoreOptionsWithId<T>
): Store<T>;

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
