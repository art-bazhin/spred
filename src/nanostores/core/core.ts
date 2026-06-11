type Signal<T> = Atom<T> | Computed<T>;
type TrackingGetter = <T>(signal: Signal<T>) => T;
type Computation<T> = (track: TrackingGetter) => T;
type Subscriber<T> = (value: T, prevValue?: T) => void;

const IS_COMPUTING = -1;
const HAS_EXCEPTION = -2;

let computing: Signal<any> | null = null;
let scope: any = null;

let globalVersion = 1;
let notificationVersion = 1;
let batchLevel = 0;
let checkLevel = 0;
let deactivateLevel = 0;
let lastTriggeredWritablesLength = 0;

let triggeredWritables: Atom<any>[] = [];
let linksToSubscribers: Link[] = [];
let signalsToDeactivate: Signal<any>[] = [];

const NONE = Symbol();
interface Link {
  source: Signal<any> | null;
  target: Signal<any> | Subscriber<any>;
  cache: any;

  ns: Link | null;
  pt: Link | null;
  nt: Link | null;
}

function createLink(
  source: Signal<any> | null,
  target: Signal<any> | Subscriber<any>
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

function addTarget(signal: Signal<any>, link: Link) {
  let lt = signal._lastTarget;

  link.pt = lt;
  signal._lastTarget = link;

  if (lt) {
    lt.nt = link;
    return;
  }

  for (
    let link: Link | null = signal._firstSource;
    link !== null;
    link = link.ns
  ) {
    addTarget(link.source!, link);
  }

  // const onDeactivate = signal.onActivate?.(signal._value);

  // if (typeof onDeactivate === 'function') {
  //   signal.onDeactivate = onDeactivate;
  // }
}

function removeTarget(
  signal: Signal<any>,
  link: Link,
  deactivateImmediately?: boolean
) {
  if (signal._lastTarget === link) signal._lastTarget = link.pt;
  if (link.pt) link.pt.nt = link.nt;
  if (link.nt) link.nt.pt = link.pt;

  link.pt = null;
  link.nt = null;

  if (deactivateImmediately) deactivate(signal);
  else signalsToDeactivate.push(signal);
}

function deactivate(signal: Signal<any>) {
  if (signal._lastTarget) return;

  ++deactivateLevel;

  for (
    let link: Link | null = signal._firstSource;
    link !== null;
    link = link.ns
  ) {
    removeTarget(link.source!, link, true);
  }

  --deactivateLevel;

  // try {
  //   signal.onCleanup?.(signal._value);
  //   signal.onDeactivate?.(signal._value);
  // } catch (e) {
  //   config.logException?.(e);
  // }
}

interface Entity<T> {
  get(): T;
  subscribe<I extends boolean>(
    subscriber: Subscriber<true extends I ? T : Exclude<T, typeof NONE>>,
    immediate?: I
  ): () => void;
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
  _cursor: Link | null;
  /** @internal */
  _computing: Signal<any> | null;
  /** @internal */
  _exception?: unknown;
}

function subscribe<T>(
  this: Signal<T>,
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
      // config.logException?.(e);
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

  // const parent = computing || scope;

  // if (parent) addChild(parent, dispose);

  return dispose;
}

function sync() {
  if (triggeredWritables.length > lastTriggeredWritablesLength) {
    ++globalVersion;
    lastTriggeredWritablesLength = triggeredWritables.length;
  }

  if (batchLevel || computing || triggeredWritables.length === 0) return;

  const writables = triggeredWritables;
  const stack: Signal<any>[] = [];

  triggeredWritables = [];
  ++batchLevel;
  lastTriggeredWritablesLength = 0;

  for (let i = writables.length - 1; i >= 0; i--) {
    const signal = writables[i];

    signal.get();
    if (signal._updated > notificationVersion) stack.push(signal);
  }

  notificationVersion = globalVersion;

  for (let signal = stack.pop(); signal !== undefined; signal = stack.pop()) {
    if (signal._notified === globalVersion) continue;
    signal._notified = globalVersion;

    let subs = 0;

    for (let link = signal._lastTarget; link !== null; link = link.pt) {
      const target = link.target;

      if (typeof target === 'function') ++subs;
      else if (target._notified !== globalVersion) stack.push(target);

      if (link.pt === null) {
        for (let l = link as Link | null; subs > 0 && l !== null; l = l!.nt) {
          if (typeof l.target === 'function') {
            linksToSubscribers.push(l);
            --subs;
          }
        }
      }
    }
  }

  for (let link of linksToSubscribers) {
    const signal = link.source;

    if (signal) signal.get();
    else continue;

    const updated = signal._updated;
    const lastUpdated = (link.ns as any as number) || 0;

    if (updated >= notificationVersion && updated > lastUpdated) {
      try {
        (link.target as any)(signal._value, link.cache);
      } catch (e) {
        // config.logException?.(e);
      } finally {
        link.cache = signal._value;
        (link.ns as any) = signal._updated;
      }
    }
  }

  for (let signal of signalsToDeactivate) deactivate(signal);

  --batchLevel;

  linksToSubscribers = [];
  signalsToDeactivate = [];

  sync();
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
interface Atom<T> extends Entity<T> {
  set(value: T): void;
  _nextValue: T;
}

function getAtomValue<T>(this: Atom<T>) {
  if (this._version < globalVersion) {
    const currentValue = this._value;
    const nextValue = this._nextValue;

    if (
      nextValue !== NONE &&
      (currentValue === NONE ||
        !(Object.is && Object.is(nextValue, currentValue)))
    ) {
      this._value = nextValue;
      this._updated = globalVersion;
      // this.onUpdate?.(nextValue, currentValue);
    }
  }

  return this._value;
}

function set<T>(this: Atom<T>, value: T) {
  if (value === NONE) return;
  this._nextValue = value;
  triggeredWritables.push(this);
  sync();
}

export function atom<T>(value: T): Atom<T> {
  return {
    subscribe,
    set,
    get: getAtomValue,
    _nextValue: value,
    _value: value,
    _updated: 0,
    _notified: 0,
    _version: 0,
    _firstSource: null,
    _lastTarget: null,
    _cursor: null,
    _computing: null,
  };
}

interface Computed<T> extends Entity<T> {
  /** @internal */
  _compute: Computation<T>;
}

function track<T>(signal: Signal<T>) {
  let shouldAddTarget = false;

  if (computing) {
    if (signal._computing === computing) return signal._value;

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

    cursor.cache = signal._computing;
    signal._computing = computing;

    if (source !== signal) {
      if (computing._lastTarget) {
        // if (source) removeTarget(source, cursor);
        shouldAddTarget = true;
      }
      cursor.source = signal;
    }
  }

  return signal.get();
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

      // if (this._compute) {
      //   this.onCleanup?.(currentValue);
      //   if (this._children) {
      //     cleanupChildren(this);
      //   }
      // }

      try {
        const nextValue = this._compute(track);

        if (
          nextValue !== NONE &&
          (currentValue === NONE ||
            !(Object.is && Object.is(nextValue, currentValue)))
        ) {
          this._value = nextValue;
          this._updated = globalVersion;
          // this.onUpdate?.(nextValue, currentValue);
        }
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
    // else config.logException?.(this._exception);

    // this.onException?.(this._exception, this._value);
  }

  if (computing === null && triggeredWritables.length) sync();

  return this._value;
}

export function computed<T>(compute: Computation<T>): Computed<T> {
  return {
    subscribe,
    get: getComputedValue,
    _compute: compute,
    _value: NONE as any,
    _updated: 0,
    _notified: 0,
    _version: 0,
    _firstSource: null,
    _lastTarget: null,
    _cursor: null,
    _computing: null,
  };
}
