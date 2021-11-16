import { writable, WritableAtom } from '../writable/writable';
import { Atom } from '../atom/atom';
import { computed } from '../computed/computed';

interface StoreData<T> {
  [id: string]: T | undefined;
}

interface Store<T> {
  get(id: string): Atom<T | undefined>;
  set(...items: T[]): void;
  delete(id: string): void;
  clear(): void;
}

interface _Store<T> extends Store<T> {
  _idFn: (item: T) => string;
  _data: WritableAtom<StoreData<T>>;
  _atoms: {
    [id: string]: Atom<T | undefined>;
  };
}

function defaultIdFn<T>(item: T) {
  return (item as any).id;
}

function createData<T>(items: T[], idFunction = defaultIdFn) {
  const data: StoreData<T> = {};

  if (!items) return data;

  for (let item of items) {
    data[idFunction(item)] = item;
  }

  return data;
}

function get<T>(this: _Store<T>, id: string) {
  if (!this._atoms[id]) this._atoms[id] = computed(() => this._data()[id]);
  return this._atoms[id];
}

function set<T>(this: _Store<T>, ...items: T[]) {
  for (let item of items) {
    const id = this._idFn(item);
    this._data()[id] = item;
  }

  this._data.notify();
}

function remove<T>(this: _Store<T>, id: string) {
  delete this._data()[id];
  delete this._atoms[id];
  this._data.notify();
}

function clear<T>(this: _Store<T>) {
  this._atoms = {};
  this._data({});
}

export function store<T extends { id: string }>(items?: T[]): Store<T>;

export function store<T>(items: T[], idFunction: (item: T) => string): Store<T>;

export function store<T>(items?: any, idFunction?: any) {
  const res: _Store<T> = {
    _idFn: idFunction || defaultIdFn,
    _atoms: {},
    _data: writable(createData(items, idFunction)),
    get,
    set,
    clear,
    delete: remove,
  };

  return res as Store<T>;
}
