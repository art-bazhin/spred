import { writable, WritableAtom } from '../writable/writable';
import { Atom, _Atom } from '../atom/atom';
import { computed } from '../computed/computed';
import { update } from '../core/core';

interface StoreOptions<T> {
  getItemId?: (item: T) => string;
  shouldUpdate?: (value: T | undefined, prevValue: T | undefined) => boolean;
}

interface StoreOptionsWithId<T> extends StoreOptions<T> {
  getItemId: (item: T) => string;
}

interface StoreData<T> {
  [id: string]: T | undefined;
}

export interface Store<T> {
  get(id: string): Atom<T | undefined>;
  set(...items: T[]): void;
  delete(id: string): void;
  clear(): void;
}

interface _Store<T> extends Store<T> {
  _options: StoreOptions<T>;
  _idFn: (item: T) => string;
  _data: WritableAtom<StoreData<T>>;
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

function get<T>(this: _Store<T>, id: string) {
  if (!this._atoms[id]) {
    this._atoms[id] = computed<T | undefined>(() => this._data()[id], {
      shouldUpdate: this._options.shouldUpdate,
    });
  }

  return this._atoms[id]!;
}

function set<T>(this: _Store<T>, ...items: T[]) {
  for (let item of items) {
    const id = this._idFn(item);
    this._data()[id] = item;

    const atom = this._atoms[id];
    if (atom) update(atom as _Atom<T>);
  }
}

function remove<T>(this: _Store<T>, id: string) {
  const atom = this._atoms[id];

  delete this._data()[id];
  delete this._atoms[id];

  if (atom) update(atom as _Atom<T>);
}

function clear<T>(this: _Store<T>) {
  this._atoms = {};
  this._data({});
}

export function store<T extends { id: string }>(
  items?: T[],
  options?: StoreOptions<T>
): Store<T>;

export function store<T>(items: T[], options: StoreOptionsWithId<T>): Store<T>;

export function store<T>(items?: any, options?: any) {
  const opts = Object.assign({}, DEFAULT_STORE_OPTIONS, options || {});

  const res: _Store<T> = {
    _options: opts,
    _idFn: opts.getItemId,
    _atoms: {},
    _data: writable(createData(items, opts.getItemId)),
    get,
    set,
    clear,
    delete: remove,
  };

  return res as Store<T>;
}
