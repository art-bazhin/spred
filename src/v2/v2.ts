let globalVersion = 1;
let tracking: Signal<any> | null = null;
let batchLevel = 0;

let sources: WritableSignal<any>[] = [];
let targets: Signal<any>[] = [];
let reactions: Link[] = [];

interface Link {
  source: Signal<any> | null;
  target: Signal<any> | Subscriber<any>;

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
 * A function that returns the value of the passed signal and handles dependency tracking.
 * @param signal A signal to track.
 * @returns The value of the passed signal.
 */
export type TrackingGetter = <T>(signal: Signal<T>) => T;

/**
 * A function subscribed to updates of a signal.
 * @param value The new value of the signal.
 * @param immediate Determines if the function was executed immediately after subscription.
 */
export type Subscriber<T> = (value: T, immediate: boolean) => void;

/**
 * A function that calculates the new value of the signal.
 * @param get Tracking function to get values of other signals.
 * @param scheduled Determines if the recalculation was caused by a dependency update.
 * @returns The value of the signal.
 */
export type Computation<T> = (get: TrackingGetter, scheduled: boolean) => T;

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
  equal?: ((value: T, prevValue?: T) => unknown) | false;

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
  onUpdate?: (value: T, prevValue?: T) => void;

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
  onException?: (e: unknown, prevValue?: T) => void;
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
    subscriber: Subscriber<true extends I ? T : Exclude<T, undefined>>,
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
  _source: Link;
  /** @internal */
  _target: Link | null;

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
  this._value = undefined as any;

  this._version = 0;
  this._updated = 0;
  this._notified = 0;

  this._source = {
    source: null,
    target: this,
    ns: null,
    pt: null,
    nt: null,
  };

  this._target = null;

  this._compute = compute;

  if (options) {
    for (let key in options) {
      if (OPTIONS[key]) (this as any)[key] = (options as any)[key];
    }
  }
}

Signal.prototype.subscribe = function <T>(
  this: Signal<T>,
  subscriber: Subscriber<T>,
  immediate = true
) {
  if (this._version === -1) this._version = 0;

  const tempTracking = tracking;

  tracking = null;
  ++batchLevel;

  const value = this.value;

  const link: Link = {
    source: this,
    target: subscriber,
    ns: null,
    pt: null,
    nt: null,
  };

  addTarget(this, link);

  if (immediate) subscriber(value, true);

  tracking = tempTracking;
  --batchLevel;

  sync();

  return () => {
    const source = link.source;

    if (source === null) return;

    link.source = null;
    removeTarget(source, link);
  };
};

function addTarget(signal: Signal<any>, link: Link) {
  let lt = signal._target;

  link.pt = lt;
  signal._target = link;

  if (lt) {
    lt.nt = link;
    return;
  }

  for (
    let link: Link | null = signal._source;
    link!.source !== null;
    link = link!.ns
  ) {
    addTarget(link!.source!, link!);
  }

  signal.onActivate?.(signal._value);
}

function removeTarget(signal: Signal<any>, link: Link) {
  if (signal._target === link) signal._target = link.pt;
  if (link.pt) link.pt.nt = link.nt;
  if (link.nt) link.nt.pt = link.pt;

  link.pt = null;
  link.nt = null;

  if (signal._target) return;

  for (
    let link: Link | null = signal._source;
    link!.source !== null;
    link = link!.ns
  ) {
    removeTarget(link!.source!, link!);
  }

  signal.onCleanup?.(signal._value);
  signal.onDeactivate?.(signal._value);
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

Object.defineProperty(Signal.prototype, 'value', {
  get() {
    if (this._version < globalVersion) {
      if (this._version === -1) return (this as any)._nextValue;

      let shouldCompute = false;

      for (
        let link: Link | null = this._source;
        link!.source !== null;
        link = link!.ns
      ) {
        const source = link!.source!;

        source.value;

        if (source._updated > this._version) {
          shouldCompute = true;
          break;
        }
      }

      this._version = globalVersion;

      if (this._source.source === null) {
        shouldCompute = true;
      }

      if (shouldCompute) {
        const tempTracking = tracking;
        const firstSource = this?._source;

        tracking = this;

        const nextValue = this._compute
          ? this._compute!(get)
          : (this as any)._nextValue;

        if (nextValue !== this._value) {
          this._value = nextValue;
          this._updated = globalVersion;
        }

        for (
          let link: Link | null = this._source;
          link!.source !== null;
          link = link!.ns
        ) {
          removeTarget(link!.source!, link!);
        }

        this._source.source = null;
        this._source.ns = null;
        this._source = firstSource;

        tracking = tempTracking;
      }
    }

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
   * @param updateFn A function that updates the current value or returns a new value.
   */
  update(updateFn: (lastValue: T) => T | void): void;

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

  this._nextValue = value;
  this._version = -1;
}

WritableSignal.prototype = new (Signal as any)();
WritableSignal.prototype.constructor = WritableSignal;

WritableSignal.prototype.set = function <T>(value: T) {
  this._nextValue = value;
  if (this._version === -1) return;
  sources.push(this);
  sync();
};

WritableSignal.prototype.update = function <T>(
  this: WritableSignal<T> & Signal<T>,
  updateFn: (value: T) => T | void
) {
  const value = updateFn(this._nextValue);
  if (value === undefined) this.emit();
  else this.emit(value);
};

WritableSignal.prototype.emit = function <T>(
  this: WritableSignal<T> & Signal<T>,
  value?: T
) {
  // this._flags |= FORCED;
  this.set(arguments.length ? value : (this._nextValue as any));
};

function notify(signal: Signal<any>) {
  if (signal._notified === globalVersion) return;
  signal._notified = globalVersion;

  let notInTargets = true;

  for (let link: Link | null = signal._target; link !== null; link = link.pt) {
    const target = link.target;

    if (typeof target === 'function') {
      reactions.push(link);

      if (notInTargets) {
        targets.push(signal);
        notInTargets = false;
      }
    } else notify(target);
  }
}

/**
 * Сreates a signal that automatically calculates its value based on other signals.
 * @param compute A function that calculates the signal value and returns it.
 * @param options Signal options.
 * @returns A computed signal.
 */
export function signal<T>(
  compute: Computation<T>,
  options?: SignalOptions<T>
): Signal<T>;

/**
 * Сreates a writable signal.
 * @returns A writable signal.
 */
export function signal<T>(): WritableSignal<T | undefined>;

/**
 * Сreates a writable signal.
 * @param value An initial value of the signal.
 * @param options Signal options.
 * @returns A writable signal.
 */
export function signal<T>(
  value: Exclude<T, Function>,
  options?: SignalOptions<T>
): WritableSignal<T>;

export function signal(value?: any, options?: any) {
  if (typeof value === 'function') return new (Signal as any)(value, options);
  return new (WritableSignal as any)(value, options);
}

function sync() {
  if (batchLevel || !sources.length) return;

  const s = sources;
  sources = [];

  ++globalVersion;

  for (let source of s) {
    source.value;
    if (source._updated === globalVersion) notify(source);
  }

  for (let target of targets) {
    target.value;
  }

  ++batchLevel;

  for (let link of reactions) {
    if (link.source?._updated === globalVersion)
      (link.target as any)(link.source._value, false);
  }

  --batchLevel;

  targets = [];
  reactions = [];

  sync();
}

export function batch(cb: () => void) {
  ++batchLevel;
  cb();
  --batchLevel;
  sync();
}

function get<T>(signal: Signal<T>) {
  if (tracking) {
    const source = tracking._source.source;

    if (source !== signal) {
      if (source) removeTarget(source, tracking._source);
      tracking._source.source = signal;
      if (tracking._target) addTarget(signal, tracking._source);
    }

    if (!tracking._source.ns) {
      tracking._source.ns = {
        source: null,
        target: tracking,
        ns: null,
        pt: null,
        nt: null,
      };
    }

    tracking._source = tracking._source.ns;

    if (signal._version === -1) signal._version = 0;
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

export const v2 = {
  Signal,
  WritableSignal,
  signal,
  batch,
};
