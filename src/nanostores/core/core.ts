type TrackingGetter = <T>(store: Store<T>) => T;
type Computation<T> = (track: TrackingGetter, prevValue?: T) => T;
type Subscriber<T> = (value: T, prevValue?: T) => void;

const IS_COMPUTING = -1;
const HAS_EXCEPTION = -2;

const ON_ACTIVATE_KEY = 1;
const ON_DEACTIVATE_KEY = 2;
const ON_UPDATE_KEY = 3;

let globalVersion = 1;
let notificationVersion = 1;
let batchLevel = 0;
let checkLevel = 0;
let lastTriggeredWritablesLength = 0;

let computing: Computed<any> | null = null;
let triggeredWritables: Atom<any>[] = [];
let linksToSubscribers: Link[] = [];
let storesToDeactivate: Store<any>[] = [];

/**
 * A library configuration object.
 */
export interface Config {
  /**
   * A function that logs exceptions. Default is console.error.
   * @param e An exception to log.
   */
  logException: (e: unknown) => void;
}

const DEFAULT_CONFIG: any = {
  logException: /* istanbul ignore next */ (e: unknown) => console.error(e),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

/**
 * Configurate the library. Call without arguments to use the default configuration.
 * @param configUpdate A configuration object.
 */
export function configure(configUpdate?: Partial<Config>) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}

interface Link {
  source: Store<any> | null;
  target: Store<any> | Subscriber<any>;
  cache: any;

  ns: Link | null;
  pt: Link | null;
  nt: Link | null;
}

function createLink(
  source: Store<any> | null,
  target: Store<any> | Subscriber<any>
): Link {
  return {
    source,
    target,
    cache: null,
    ns: null,
    pt: null,
    nt: null,
  };
}

function addTarget(store: Store<any>, link: Link) {
  let lt = store._lastTarget;

  link.pt = lt;
  store._lastTarget = link;

  if (lt) {
    lt.nt = link;
    return;
  }

  for (
    let link: Link | null = store._firstSource;
    link !== null;
    link = link.ns
  ) {
    addTarget(link.source!, link);
  }

  store._events?.[ON_ACTIVATE_KEY]?.(store._value);
}

function removeTarget(
  store: Store<any>,
  link: Link,
  deactivateImmediately?: boolean
) {
  if (store._lastTarget === link) store._lastTarget = link.pt;
  if (link.pt) link.pt.nt = link.nt;
  if (link.nt) link.nt.pt = link.pt;

  link.pt = null;
  link.nt = null;

  if (deactivateImmediately) deactivate(store);
  else storesToDeactivate.push(store);
}

function deactivate(store: Store<any>) {
  if (store._lastTarget) return;

  for (
    let link: Link | null = store._firstSource;
    link !== null;
    link = link.ns
  ) {
    removeTarget(link.source!, link, true);
  }

  try {
    // store.onCleanup?.(store._value);
    store._events?.[ON_DEACTIVATE_KEY]?.(store._value);
  } catch (e) {
    config.logException?.(e);
  }
}

function addChild(parent: Store<any>, child: Store<any> | (() => void)) {
  if (!parent._children) parent._children = [];
  parent._children.push(child);
}

function cleanupChildren(parent: Store<any>) {
  for (let child of parent._children!) {
    if (typeof child === 'function') child();
    else if (child._children) cleanupChildren(child);
  }

  parent._children = [];
}

export interface StoreOptions<T> {
  /**
   * An equality function used to check whether the value of the store has been changed. Default is Object.is.
   * @param value A new value of the store.
   * @param prevValue A previous value of the store.
   * @returns Truthy if the values are equal, falsy otherwise.
   */
  equal?: ((value: T, prevValue?: T) => unknown) | false;
}

interface Store<T> {
  get(): T;
  subscribe(subscriber: Subscriber<T>, immediate?: boolean): () => void;
  /** @internal */
  _value: T;
  /** @internal */
  _updated: number;
  /** @internal */
  _notified: number;
  /** @internal */
  _version: number;
  /** @internal */
  _firstSource: Link | null;
  /** @internal */
  _lastTarget: Link | null;
  /** @internal */
  _equal: ((value: T, prevValue?: T) => unknown) | false;
  /** @internal */
  _cursor: Link | null;
  /** @internal */
  _computing: Store<any> | null;
  /** @internal */
  _level: number;
  /** @internal */
  _exception?: unknown;
  /** @internal */
  _children?: (Store<any> | (() => void))[];
  /** @internal */
  _events?: any;
}

function subscribe<T>(
  this: Store<T>,
  subscriber: Subscriber<T>,
  immediate = true
) {
  ++batchLevel;

  const value = this.get();
  const link: Link = createLink(this, subscriber);

  link.cache = value;

  addTarget(this, link);

  if (immediate && this._version !== HAS_EXCEPTION) {
    try {
      subscriber(value);
    } catch (e) {
      config.logException?.(e);
    }
  }

  --batchLevel;

  sync();

  const dispose = () => {
    const source = link.source;

    if (source === null) return;

    link.source = null;
    link.cache = null;

    removeTarget(source, link, true);
  };

  if (computing) addChild(computing, dispose);

  return dispose;
}

function sync() {
  if (triggeredWritables.length > lastTriggeredWritablesLength) {
    ++globalVersion;
    lastTriggeredWritablesLength = triggeredWritables.length;
  }

  if (batchLevel || computing || triggeredWritables.length === 0) return;

  const writables = triggeredWritables;
  const stack: Store<any>[] = [];

  triggeredWritables = [];
  ++batchLevel;
  lastTriggeredWritablesLength = 0;

  for (let i = writables.length - 1; i >= 0; i--) {
    const store = writables[i];

    store.get();
    if (store._updated > notificationVersion) stack.push(store);
  }

  notificationVersion = globalVersion;

  let level = -1;
  let sortSubscribers = false;

  for (let store = stack.pop(); store !== undefined; store = stack.pop()) {
    if (store._notified === globalVersion) continue;
    store._notified = globalVersion;

    let subs = 0;

    for (let link = store._lastTarget; link !== null; link = link.pt) {
      const target = link.target;

      if (typeof target === 'function') ++subs;
      else if (target._notified !== globalVersion) stack.push(target);

      if (link.pt === null) {
        for (let l = link as Link | null; subs > 0 && l !== null; l = l!.nt) {
          if (typeof l.target === 'function') {
            linksToSubscribers.push(l);
            --subs;

            const nextLevel = l.source!._level;

            sortSubscribers ||= level >= 0 && level !== nextLevel;
            level = nextLevel;
          }
        }
      }
    }
  }

  if (sortSubscribers)
    linksToSubscribers.sort((a, b) => a.source!._level - b.source!._level);

  for (let link of linksToSubscribers) {
    const store = link.source;

    if (store) store.get();
    else continue;

    const updated = store._updated;
    const lastUpdated = (link.ns as any as number) || 0;

    if (updated >= notificationVersion && updated > lastUpdated) {
      try {
        (link.target as any)(store._value, link.cache);
      } catch (e) {
        config.logException?.(e);
      } finally {
        link.cache = store._value;
        (link.ns as any) = store._updated;
      }
    }
  }

  for (let store of storesToDeactivate) deactivate(store);

  --batchLevel;

  linksToSubscribers = [];
  storesToDeactivate = [];

  sync();
}

function updateStore(
  store: Store<any>,
  nextValue: any,
  currentValue: any,
  forced?: boolean
) {
  if (forced || !(store._equal && store._equal(nextValue, currentValue))) {
    store._value = nextValue;
    store._updated = globalVersion;
    store._events?.[ON_UPDATE_KEY]?.(nextValue, currentValue);
  }
}

export function batch(fn: () => void) {
  ++batchLevel;

  try {
    fn();
  } finally {
    --batchLevel;
    sync();
  }
}
interface Atom<T> extends Store<T> {
  set(value: T): void;
  update(updater?: (value: T) => T | void): void;
  _nextValue: T;
}

function getAtomValue<T>(this: Atom<T>) {
  if (this._version < globalVersion) {
    updateStore(this, this._nextValue, this._value);
    this._version = globalVersion;
  }

  return this._value;
}

function set<T>(this: Atom<T>, value: T) {
  this._nextValue = value;
  triggeredWritables.push(this);
  sync();
}

function update<T>(this: Atom<T>, updater?: (value: T) => T | void) {
  const nextValue = updater?.(this._nextValue);
  this._updated = globalVersion + 1;
  this.set(nextValue === undefined ? this._nextValue : nextValue);
}
export function atom<T>(): Atom<T | undefined>;
export function atom<T>(value: T, options?: StoreOptions<T>): Atom<T>;
export function atom(value?: any, options?: any) {
  const store = {
    subscribe,
    set,
    update,
    get: getAtomValue,
    _nextValue: value,
    _value: value,
    _updated: 0,
    _notified: 0,
    _version: 0,
    _firstSource: null,
    _lastTarget: null,
    _equal: options?.equal ?? Object.is,
    _cursor: null,
    _computing: null,
    _level: computing ? computing._level + 1 : 0,
  };

  if (computing) addChild(computing, store);

  return store;
}

interface Computed<T> extends Store<T> {
  /** @internal */
  _compute: Computation<T>;
}

function track<T>(store: Store<T>) {
  let shouldAddTarget = false;

  if (computing) {
    if (store._computing === computing) return store._value;

    let cursor = computing._cursor;

    if (cursor) {
      if (cursor.ns === null) cursor.ns = createLink(null, computing);
      computing._cursor = cursor.ns;
    } else {
      if (computing._firstSource) {
        computing._cursor = computing._firstSource;
      } else {
        computing._cursor = createLink(null, computing);
        computing._firstSource = computing._cursor;
      }
    }

    cursor = computing._cursor;
    const source = cursor.source;

    cursor.cache = store._computing;
    store._computing = computing;

    if (source !== store) {
      if (computing._lastTarget) {
        if (source) removeTarget(source, cursor);
        shouldAddTarget = true;
      }
      cursor.source = store;
    }
  }

  const value = store.get();

  if (shouldAddTarget) addTarget(store, computing!._cursor!);

  return value;
}

function getComputedValue<T>(this: Computed<T>) {
  if (this._version === IS_COMPUTING) {
    throw new Error('Circular dependency detected');
  }

  if (
    this._version < globalVersion &&
    (computing ||
      !this._lastTarget ||
      this._notified === globalVersion ||
      triggeredWritables.length)
  ) {
    const version = this._version;
    const hasException = version === HAS_EXCEPTION;

    let shouldCompute = false;

    this._version = IS_COMPUTING;

    if (this._firstSource === null || hasException) {
      shouldCompute = true;
    } else {
      ++checkLevel;

      try {
        for (
          let link: Link | null = this._firstSource;
          link !== null;
          link = link.ns
        ) {
          const source = link!.source!;

          if (source._updated <= version) source.get();

          if (source._updated > version) {
            shouldCompute = true;
            break;
          }
        }
      } catch (e) {
        shouldCompute = true;
      }

      --checkLevel;
    }

    if (shouldCompute) {
      const tempComputing = computing;
      const currentValue = this._value;

      computing = this;

      // this.onCleanup?.(currentValue);
      if (this._children) cleanupChildren(this);

      try {
        updateStore(
          this,
          this._compute(track, currentValue),
          currentValue,
          this._updated === 0
        );
      } catch (e) {
        this._exception = e;
        this._version = HAS_EXCEPTION;
      }

      if (this._cursor) {
        const next = this._cursor.ns;

        for (
          let link: Link | null = this._firstSource;
          link !== next;
          link = link!.ns
        ) {
          link!.source!._computing = link!.cache;
          link!.cache = null;
        }

        if (next) {
          this._cursor.ns = null;

          for (let link: Link | null = next; link !== null; link = link.ns) {
            removeTarget(link.source!, link);
          }
        }
      }

      this._cursor = null;

      computing = tempComputing;
    }

    if (this._version !== HAS_EXCEPTION) {
      this._version = globalVersion;
      if (hasException) this._exception = undefined;
    }
  }

  if (this._version === HAS_EXCEPTION) {
    if (computing || checkLevel) throw this._exception;
    else config.logException?.(this._exception);

    // this.onException?.(this._exception, this._value);
  }

  if (computing === null && triggeredWritables.length) sync();

  return this._value;
}

export function computed<T>(
  compute: Computation<T>,
  options?: StoreOptions<T>
): Computed<T>;
export function computed<T>(first: any, second: any, third?: any): Computed<T> {
  const isOldApi = typeof second === 'function';
  const options = isOldApi ? third : second;
  const sources = isOldApi
    ? Array.isArray(first)
      ? first
      : [first]
    : undefined;
  const compute = isOldApi
    ? (track: TrackingGetter) => second(...sources!.map(track))
    : first;

  const store = {
    subscribe,
    get: getComputedValue,
    _compute: compute,
    _value: undefined as any,
    _updated: 0,
    _notified: 0,
    _version: 0,
    _firstSource: null,
    _lastTarget: null,
    _equal: options?.equal ?? Object.is,
    _cursor: null,
    _computing: null,
    _level: computing ? computing._level + 1 : 0,
  } as Computed<T>;

  if (computing) addChild(computing, store);

  return store;
}
