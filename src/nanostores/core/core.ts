type Signal<T> = Atom<T> | Computed<T>;
type TrackingGetter = <T>(signal: Signal<T>) => T;
type Computation<T> = (track: TrackingGetter) => T;
type Subscriber<T> = (value: T, prevValue?: T) => void;

const IS_COMPUTING = -1;

const NONE = Symbol();

let globalVersion = 1;
let computing: Computed<any> | null = null;

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

interface Entity<T> {
  /** @internal */
  _value: T;
  /** @internal */
  _updated: number;
  /** @internal */
  _version: number;
  /** @internal */
  _lastTarget: Link | null;
  /** @internal */
  _cursor: Link | null;
  /** @internal */
  _computing: Signal<any> | null;
}
interface Atom<T> extends Entity<T> {
  get(): T;
  set(value: T): void;
}

function getAtomValue<T>(this: Atom<T>) {
  return this._value;
}

function set<T>(this: Atom<T>, value: T) {
  if (Object.is(this._value, value)) return;

  this._updated = ++globalVersion;
  this._version = this._updated;
  this._value = value;
}

export function atom<T>(value: T): Atom<T> {
  return {
    get: getAtomValue,
    set,
    _value: value,
    _updated: 0,
    _version: 0,
    _lastTarget: null,
    _cursor: null,
    _computing: null,
  };
}

interface Computed<T> extends Entity<T> {
  get(): T;

  /** @internal */
  _compute: Computation<T>;
  /** @internal */
  _firstSource: Link | null;
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

  if (this._version !== globalVersion) {
    const version = this._version;

    let shouldCompute = false;
    const prevVersion = this._version;

    if (this._firstSource) {
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
    } else shouldCompute = true;

    if (shouldCompute) {
      this._version = IS_COMPUTING;

      const prevComputing = computing;
      computing = this;

      try {
        const newValue = this._compute(track);

        if (!Object.is(newValue, this._value)) {
          this._value = newValue;
          this._updated = globalVersion;
        }
      } catch (e) {
        this._version = prevVersion;
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

          // for (let link: Link | null = next; link !== null; link = link.ns) {
          //   removeTarget(link.source!, link);
          // }
        }
      }

      this._cursor = null;

      computing = prevComputing;
    }

    this._version = globalVersion;
  }

  return this._value;
}

export function computed<T>(compute: Computation<T>): Computed<T> {
  return {
    get: getComputedValue,
    _compute: compute,
    _value: NONE as any,
    _updated: 0,
    _version: 0,
    _lastTarget: null,
    _cursor: null,
    _computing: null,

    _firstSource: null,
  };
}
