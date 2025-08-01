import { config } from '../config/config';
import { CircularDependencyError } from '../common/errors';

const IS_COMPUTING = -1;
const HAS_EXCEPTION = -2;

let computing: Signal<any> | null = null;
let scope: any = null;

let globalVersion = 1;
let batchLevel = 0;
let checkLevel = 0;

let triggeredWritables: WritableSignal<any>[] = [];
let linksToSubscribers: Link[] = [];
let signalsToDeactivate: Signal<any>[] = [];

interface Link {
  source: Signal<any> | null;
  target: Signal<any> | Subscriber<any>;
  cache: Signal<any> | null;

  ns: Link | null;
  pt: Link | null;
  nt: Link | null;
}

const OPTIONS: any = {
  name: 1,
  equal: 1,
  onCreate: 1,
  onActivate: 1,
  onDeactivate: 1,
  onUpdate: 1,
  onCleanup: 1,
  onException: 1,
};

/**
 * Special value indicating no result.
 *
 * Return `NONE` from a computation to keep the current value and skip the update.
 * Computed signals start as `NONE` until the first successful evaluation.
 */
export const NONE = Symbol('NONE');

/**
 * A function that returns the value of the passed signal and handles dependency tracking.
 * @param signal A signal to track.
 * @returns The value of the passed signal.
 */
export type TrackingGetter = <T>(signal: Signal<T>) => T;

/**
 * A function subscribed to updates of a signal.
 * @param value The new value of the signal.
 */
export type Subscriber<T> = (value: T) => void;

/**
 * A function that calculates the new value of the signal.
 * @param get Tracking function to get values of other signals.
 * @returns The value of the signal.
 */
export type Computation<T> = (get: TrackingGetter) => T;

/**
 * A function that creates a new entity based on the source.
 * @param source A source entity.
 * @returns The newly created entity.
 */
export type Operator<S, T> = (source: S) => T;

/**
 * An object that stores the options of the signal to be created.
 */
export interface SignalOptions<T> {
  /**
   * A name of the signal. Can be accessed inside a lifecycle function via this.
   */
  name?: string;

  /**
   * An equality function used to check whether the value of the signal has been changed. Default is Object.is.
   * @param value A new value of the signal.
   * @param prevValue A previous value of the signal.
   * @returns Truthy if the values are equal, falsy otherwise.
   */
  equal?: ((value: T, prevValue: T) => unknown) | false;

  /**
   * A function called at the moment the signal is created.
   * @param value An initial value of the signal.
   */
  onCreate?: (value?: T) => void;

  /**
   * A function called when the first subscriber or the first active dependent signal appears.
   * @param value The current value of the signal.
   * @returns A function to override onDeactivate option.
   */
  onActivate?: ((value: T) => void) | ((value: T) => (value: T) => void);

  /**
   * A function called when the last subscriber or the last active dependent signal disappears.
   * @param value The current value of the signal.
   */
  onDeactivate?: (value: T) => void;

  /**
   * A function called each time the signal value is updated.
   * @param value The new value of the signal.
   * @param prevValue The previous value of the signal.
   */
  onUpdate?: (value: T, prevValue: T) => void;

  /**
   * A function called each time before the signal value is calculated and when the signal is going to be deactivated.
   * Useful to cleanup subscriptions and timers created during computation.
   * @param value The current value of the signal.
   */
  onCleanup?: (value: T) => void;

  /**
   * A function called whenever an unhandled exception occurs during the calculation of the signal value.
   * @param e An exception.
   * @param prevValue The previous value of the signal.
   */
  onException?: (e: unknown, prevValue: T) => void;
}

/**
 * A basic reactive primitive. Notifies consumers of a change in the stored value and triggers them to recalculate.
 */
declare class Signal<T> {
  /**
   * @param compute A function that calculates the signal value and returns it.
   * @param options Signal options.
   * @returns A computed signal.
   */
  constructor(compute: Computation<T>, options?: SignalOptions<T>);

  /**
   * Subscribes the passed function to updates of the signal value.
   * @param subscriber A function subscribed to updates.
   * @param immediate Determines whether the function should be executed immediately after subscription. Default is true.
   * @returns An unsubscribe function.
   */
  subscribe<I extends boolean>(
    subscriber: Subscriber<true extends I ? T : Exclude<T, typeof NONE>>,
    immediate?: I
  ): () => void;

  /**
   * Sequentially creates new entities by passing the result of the operator
   * execution from the previous one to the next one.
   * @returns The result of the last operator execution.
   */
  pipe<A>(op1: Operator<Signal<T>, A>): A;

  pipe<A, B>(op1: Operator<Signal<T>, A>, op2: Operator<A, B>): B;

  pipe<A, B, C>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>
  ): C;

  pipe<A, B, C, D>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>
  ): D;

  pipe<A, B, C, D, E>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>
  ): E;

  pipe<A, B, C, D, E, F>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>
  ): F;

  pipe<A, B, C, D, E, F, G>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
    op7: Operator<F, G>
  ): G;

  pipe<A, B, C, D, E, F, G, H>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
    op7: Operator<F, G>,
    op8: Operator<G, H>
  ): H;

  pipe<A, B, C, D, E, F, G, H, I>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
    op7: Operator<F, G>,
    op8: Operator<G, H>,
    op9: Operator<H, I>
  ): I;

  pipe<A, B, C, D, E, F, G, H, I, J>(
    op1: Operator<Signal<T>, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>,
    op4: Operator<C, D>,
    op5: Operator<D, E>,
    op6: Operator<E, F>,
    op7: Operator<F, G>,
    op8: Operator<G, H>,
    op9: Operator<H, I>,
    op10: Operator<I, J>,
    op11?: Operator<J, any>,
    ...rest: Operator<any, any>[]
  ): J;

  /**
   * Empty operator pipe. Returns the signal itself.
   * @returns The signal.
   */
  pipe(): typeof this;

  /**
   * Returns the current value of the signal.
   */
  get(): T;

  /**
   * The current value of the signal.
   */
  readonly value: T;

  /** @internal */
  _value: T;
  /** @internal */
  _version: number;
  /** @internal */
  _updated: number;
  /** @internal */
  _notified: number;
  /** @internal */
  _compute?: Computation<T>;
  /** @internal */
  _exception?: unknown;
  /** @internal */
  _cursor: Link | null;
  /** @internal */
  _firstSource: Link | null;
  /** @internal */
  _firstTarget: Link | null;
  /** @internal */
  _lastTarget: Link | null;
  /** @internal */
  _computing: Signal<any> | null;
  /** @internal */
  _children?: (Signal<any> | (() => void))[];

  /** @internal */
  equal: SignalOptions<T>['equal'];
  /** @internal */
  onCreate: SignalOptions<T>['onDeactivate'];
  /** @internal */
  onActivate: SignalOptions<T>['onActivate'];
  /** @internal */
  onDeactivate: SignalOptions<T>['onDeactivate'];
  /** @internal */
  onCleanup: SignalOptions<T>['onCleanup'];
  /** @internal */
  onUpdate: SignalOptions<T>['onUpdate'];
  /** @internal */
  onException: SignalOptions<T>['onException'];
}

/** @internal */
function Signal<T>(
  this: Signal<T>,
  compute?: Computation<T>,
  options?: SignalOptions<T>
) {
  this._version = 0;
  this._updated = 0;
  this._notified = 0;

  this._value = NONE as any;

  this._cursor = null;
  this._firstSource = null;
  this._firstTarget = null;
  this._lastTarget = null;
  this._computing = null;

  this._compute = compute;

  if (options) {
    for (let key in options) {
      if (OPTIONS[key]) (this as any)[key] = (options as any)[key];
    }
  }

  if (compute) this.onCreate?.(this._value);

  const parent = computing || scope;

  if (parent) addChild(parent, this);
}

Signal.prototype.subscribe = function <T>(
  this: Signal<T>,
  subscriber: Subscriber<T>,
  immediate = true
) {
  ++batchLevel;

  const value = this.value;
  const link: Link = createLink(this, subscriber);

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
    removeTarget(source, link, true);
  };

  const parent = computing || scope;

  if (parent) addChild(parent, dispose);

  return dispose;
};

function addTarget(signal: Signal<any>, link: Link) {
  let lt = signal._lastTarget;

  link.pt = lt;
  signal._lastTarget = link;

  if (lt) {
    lt.nt = link;
    return;
  }

  signal._firstTarget = link;

  for (
    let link: Link | null = signal._firstSource;
    link !== null;
    link = link.ns
  ) {
    addTarget(link.source!, link);
  }

  const onDeactivate = signal.onActivate?.(signal._value);

  if (typeof onDeactivate === 'function') {
    signal.onDeactivate = onDeactivate;
  }
}

function removeTarget(
  signal: Signal<any>,
  link: Link,
  deactivateImmediately?: boolean
) {
  if (signal._firstTarget === link) signal._firstTarget = link.nt;
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

  for (
    let link: Link | null = signal._firstSource;
    link !== null;
    link = link.ns
  ) {
    removeTarget(link.source!, link, true);
  }

  signal.onCleanup?.(signal._value);
  signal.onDeactivate?.(signal._value);
}

function addChild(parent: Signal<any>, child: Signal<any> | (() => void)) {
  if (!parent._children) parent._children = [];
  parent._children.push(child);
}

function cleanupChildren(parent: Signal<any>) {
  for (let child of parent._children!) {
    if (typeof child === 'function') child();
    else if (child._children) cleanupChildren(child);
  }

  parent._children = [];
}

Signal.prototype.pipe = function (
  this: Signal<any>,
  ...operators: Operator<any, any>[]
) {
  let result = this;
  for (let op of operators) result = op(result);
  return result;
};

Signal.prototype.equal = Object.is;

Signal.prototype.get = function () {
  return this.value;
};

Object.defineProperty(Signal.prototype, 'value', {
  get(this: Signal<any>) {
    if (this._version === IS_COMPUTING) {
      throw new CircularDependencyError();
    }

    if (
      this._version < globalVersion &&
      (computing ||
        !this._firstTarget ||
        !this._compute ||
        this._notified === globalVersion)
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

            source.value;

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

        if (this._compute) {
          this.onCleanup?.(currentValue);
          if (this._children) {
            cleanupChildren(this);
          }
        }

        try {
          const nextValue = this._compute
            ? this._compute(get)
            : (this as any)._nextValue;

          if (
            nextValue !== NONE &&
            (currentValue === NONE ||
              !(this.equal && this.equal(nextValue, currentValue)))
          ) {
            this._value = nextValue;
            this._updated = globalVersion;
            this.onUpdate?.(nextValue, currentValue);
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
      else config.logException?.(this._exception);

      this.onException?.(this._exception, this._value);
    }

    if (computing === null && triggeredWritables.length) sync();

    return this._value;
  },
});

/**
 * A {@link Signal} whose value can be set.
 */
declare class WritableSignal<T> extends Signal<T> {
  /**
   * @param value An initial value of the signal.
   * @param options Signal options.
   * @returns A writable signal.
   */
  constructor(value: T, options?: SignalOptions<T>);

  /**
   * Sets the signal value and notify dependents if it was changed.
   * @param value The new value of the signal.
   */
  set(value: T): void;

  /**
   * Force notifies dependents.
   */
  emit(): void;

  /**
   * Sets the signal value and force notifies dependents.
   * @param value The new value of the signal.
   */
  emit(value: T): void;

  /**
   * Updates the signal value and force notifies dependents.
   * @param updateFn A function that receives the current value and returnes the new one.
   */
  update(updateFn: (lastValue: T) => T): void;

  /** @internal */
  _nextValue: T;
}

/** @internal */
function WritableSignal<T>(
  this: WritableSignal<T>,
  value: T,
  options?: SignalOptions<T>
) {
  Signal.call(this as any, undefined, options as any);

  this._value = value;
  this._nextValue = value;
  this.onCreate?.(this._value);
}

WritableSignal.prototype = new (Signal as any)();
WritableSignal.prototype.constructor = WritableSignal;

WritableSignal.prototype.set = function <T>(value: T) {
  if (value === NONE) return;
  this._nextValue = value;
  triggeredWritables.push(this);
  sync();
};

WritableSignal.prototype.update = function <T>(
  this: WritableSignal<T> & Signal<T>,
  updateFn: (value: T) => T
) {
  this.emit(updateFn(this._nextValue));
};

WritableSignal.prototype.emit = function <T>(
  this: WritableSignal<T> & Signal<T>,
  value?: T
) {
  this._updated = globalVersion + 1;
  this.set(arguments.length ? value : (this._nextValue as any));
};

function notify(signal: Signal<any>) {
  if (signal._notified === globalVersion) return;
  signal._notified = globalVersion;

  for (
    let link: Link | null = signal._firstTarget;
    link !== null;
    link = link.nt
  ) {
    const target = link.target;

    if (typeof target === 'function') linksToSubscribers.push(link);
  }

  for (
    let link: Link | null = signal._firstTarget;
    link !== null;
    link = link.nt
  ) {
    const target = link.target;

    if (typeof target !== 'function') notify(target);
  }
}

function sync() {
  if (batchLevel || computing || triggeredWritables.length === 0) return;

  const writables = triggeredWritables;
  triggeredWritables = [];

  ++globalVersion;
  ++batchLevel;

  for (let signal of writables) {
    signal.value;
    if (signal._updated === globalVersion) notify(signal);
  }

  for (let link of linksToSubscribers) {
    const signal = link.source;

    if (signal) signal.value;
  }

  for (let signal of signalsToDeactivate) deactivate(signal);

  for (let link of linksToSubscribers) {
    const signal = link.source;

    if (!signal) continue;

    if (signal._updated === globalVersion) {
      try {
        (link.target as any)(signal._value);
      } catch (e) {
        config.logException?.(e);
      }
    }
  }

  --batchLevel;

  linksToSubscribers = [];
  signalsToDeactivate = [];

  sync();
}

/**
 * Commits all writable signal updates made within the passed function as a single transaction.
 * @param fn A function with updates.
 */
export function batch(fn: () => void) {
  ++batchLevel;

  try {
    fn();
  } finally {
    --batchLevel;
    sync();
  }
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

function get<T>(signal: Signal<T>) {
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
        if (source) removeTarget(source, cursor);
        addTarget(signal, cursor);
      }
      cursor.source = signal;
    }
  }

  return signal.value;
}

/**
 * Creates a copy of the passed function which batches updates made during its execution.
 * @param fn A function to copy.
 * @returns A copy of the passed function with batched updates.
 */
export function action<T extends Function>(fn: T) {
  return function (...args: any) {
    ++batchLevel;

    try {
      // @ts-ignore
      return fn.apply(this, args);
    } finally {
      --batchLevel;
      sync();
    }
  } as any as typeof fn;
}

/**
 * Calls the passed function and returns the unsubscribe function from all signals and subscriptions created within it.
 * @param fn A function to call.
 * @returns A cleanup function.
 */
export function collect(fn: () => void) {
  const tempComputing = computing;
  const tempScope = scope;
  const fakeState: any = {};

  scope = fakeState;
  computing = null;

  try {
    fn();
  } finally {
    computing = tempComputing;
    scope = tempScope;

    return () => cleanupChildren(fakeState);
  }
}

export { Signal, WritableSignal };
