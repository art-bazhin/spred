import { computed } from '../computed/computed';
import { StateTypeError } from '../errors/errors';
import { onDeactivate, onUpdate } from '../lifecycle/lifecycle';
import { memo } from '../memo/memo';
import { Signal } from '../signal/signal';
import { writable } from '../writable/writable';

type Keys<T> = keyof T & (string | number);

type Select<T, K extends Keys<T>> = undefined extends T[K]
  ? Exclude<T[K], undefined> | null
  : T[K];

export interface Store<T> {
  state: Signal<T>;
  update(updateFn: (state: T) => T | void): void;
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

function getClone<T>(id: string, state: Signal<T>, value?: T): T {
  const cached = VALUES_CACHE[id];

  if (cached !== undefined) return cached;
  return copy(value || state.sample());
}

export function store<T>(initialState: T): Store<T> {
  const ID = 'STORE_' + counter++;
  const _state = writable(initialState);
  const state = memo(_state);

  onUpdate(_state, () => (VALUES_CACHE = {}));

  function update(updateFn: (current: T) => T | void) {
    _state((current) => {
      const clone = getClone(ID, state, current);
      const next = updateFn(clone);
      const value = next === undefined ? clone : next;

      VALUES_CACHE[ID] = value;

      return value;
    });
  }

  const select = createSelect(ID, state, update);

  return {
    state,
    update,
    select,
  };
}

function createSelect<T>(
  parentId: string,
  parentData: Signal<T>,
  parentUpdate: (updateFn: (state: T) => T | void) => void
) {
  return function <K extends Keys<T>>(key: K): Store<Select<T, K>> {
    const ID = parentId + '.' + key;
    const cached = STORES_CACHE[ID];

    if (cached) return cached;

    const _state = memo(() => {
      const parentValue = parentData() as T;
      const value = parentValue && parentValue[key];

      if (value === undefined) return null;
      return value;
    }) as Signal<Select<T, K>>;

    onDeactivate(_state, () => delete STORES_CACHE[ID]);

    function update(updateFn: (state: Select<T, K>) => Select<T, K> | void) {
      const clone = getClone(ID, _state);
      const next = updateFn(clone);
      const value = next === undefined ? clone : next;

      if (next === STOP) return;

      VALUES_CACHE[ID] = value;

      parentUpdate((parentValue: any) => {
        if (!parentValue) return STOP;
        parentValue[key] = value;
      });
    }

    const state = computed(_state);
    const select = createSelect(ID, _state, update);
    const derivedStore: Store<Select<T, K>> = {
      state,
      update,
      select,
    };

    STORES_CACHE[ID] = derivedStore;

    return derivedStore;
  };
}
