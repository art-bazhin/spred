type Signal<T> = Atom<T> | Computed<T>;
type TrackingGetter = <T>(signal: Signal<T>) => T;
type Computation<T> = (track: TrackingGetter) => T;

const IS_COMPUTING = -1

const UNSET = Symbol()

let version = 1;
let computing: Computed<unknown> | null = null

interface Entity<T> {
  /** @internal */
  _value: T;
  /** @internal */
  _updated: number;
  /** @internal */
  _version: number;
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

  this._updated = ++version;
  this._version = this._updated;
  this._value = value;
}


function atom<T>(value: T): Atom<T> {
  return {
    get: getAtomValue,
    set,
    _value: value,
    _updated: version,
    _version: version,
  }
}

interface Computed<T> extends Entity<T> {
  get(): T;

  /** @internal */
  _compute: Computation<T>;
  /** @internal */
  _deps: Signal<unknown>[] | undefined
}

function track<T>(signal: Signal<T>) {
  computing?._deps?.push(signal);
  return signal.get();
}

function getComputedValue<T>(this: Computed<T>) {
  if (this._version === IS_COMPUTING) {
    throw new Error('Circular dependency detected');
  }

  if (this._version !== version) {
    let shouldCompute = false;
    const prevVersion = this._version;

    if (this._deps) {
      for (let dep of this._deps) {
        if (dep._updated <= prevVersion) dep.get();
        if (dep._updated > prevVersion) {
          shouldCompute = true;
          break;
        }
      }
    } else shouldCompute = true;

    if (shouldCompute) {
      this._version = IS_COMPUTING;

      const prevComputing = computing;
      computing = this;

      const prevDeps = this._deps;
      this._deps = [];

      try {
        const newValue = this._compute(track)

        if (!Object.is(newValue, this._value)) {
          this._value = newValue
          this._updated = version
        }
      } catch (e) {
        this._deps = prevDeps
        this._version = prevVersion
        throw (e)
      } finally {
        computing = prevComputing;
      }
    }

    this._version = version;
  }

  return this._value;
}

function computed<T>(compute: Computation<T>): Computed<T> {
  return {
    get: getComputedValue,
    _compute: compute,
    _deps: undefined,
    _value: UNSET as any,
    _updated: 0,
    _version: 0,
  }
}

export const v3 = { atom, computed }

export { Signal, WritableSignal, Operator } from './core/core';
export { configure, Config } from './config/config';
export {
  batch,
  action,
  collect,
  Subscriber,
  SignalOptions,
  Computation,
  TrackingGetter,
  NONE,
} from './core/core';
export { on } from './on/on';
export { signal } from './signal/signal';
export { effect } from './effect/effect';
