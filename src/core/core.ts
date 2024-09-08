import { config } from '../config/config';
import { CircularDependencyError } from '../common/errors';
import {
  CHANGED,
  FORCED,
  FROZEN,
  HAS_EXCEPTION,
  NOTIFIED,
  COMPUTING,
  TRACKED,
} from '../common/constants';

interface ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
  link?: ListNode<T> | null;
}

let computing: Signal<any> | null = null;
let scope: Signal<any> | null = null;

let batchLevel = 0;

let providers: Signal<any>[] = [];
let consumers: Signal<any>[] = [];
let notifiers: Signal<any>[] = [];
let staleNodes: { value: Signal<any>; link: ListNode<any> }[] = [];

let version = 1;

/**
 * A function that gets the value of the passed signal and handles dependency tracking.
 * @param signal A signal to track.
 * @returns The value of the passed signal.
 */
export type TrackingGetter = <T>(signal: Signal<T>) => T;

/**
 * A function subscribed to updates of a signal.
 * @param value A new value of the signal.
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
  equal?: false | ((value: T, prevValue?: T) => unknown);

  /**
   * A function called at the moment the signal is created.
   * @param value An initial value of the signal.
   */
  onCreate?: (value?: T) => void;

  /**
   * A function called when the first subscriber or the first active dependent signal appears.
   * @param value A current value of the signal.
   * @returns A function to override onDeactivate option.
   */
  onActivate?: ((value: T) => void) | ((value: T) => (value: T) => void);

  /**
   * A function called when the last subscriber or the last active dependent signal disappears.
   * @param value A current value of the signal.
   */
  onDeactivate?: (value: T) => void;

  /**
   * A function called each time the signal value is updated.
   * @param value A new value of the signal.
   * @param prevValue A previous value of the signal.
   */
  onUpdate?: (value: T, prevValue?: T) => void;

  /**
   * A function called each time before the signal value is calculated and when the signal is going to be deactivated.
   * Useful to cleanup subscriptions and timers created during computation.
   * @param value A current value of the signal.
   */
  onCleanup?: (value: T) => void;

  /**
   * A function called whenever an unhandled exception occurs during the calculation of the signal value.
   * @param e An exception.
   * @param prevValue A previous value of the signal.
   */
  onException?: (e: unknown, prevValue?: T) => void;
}

/**
 * A basic reactive primitive. Notifies consumers of a change in the stored value and triggers them to recalculate.
 */
declare class Signal<T> {
  /**
   * Create a signal that automatically calculates its value based on other signals.
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
  subscribe<E extends boolean>(
    subscriber: Subscriber<true extends E ? T : Exclude<T, undefined>>,
    immediate?: E
  ): () => void;

  /**
   * Sequentially creates new entities by passing the result of the operator
   * execution from the previous one to the next one
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
   * Calculates and returns the current value of the signal.
   * @returns The current value of the signal.
   */
  get(): T;

  /**
   * The current value of the signal. A getter variant of {@link Signal.get}.
   */
  readonly value: T;

  /** @internal */
  _value: T;
  /** @internal */
  _nextValue: T;
  /** @internal */
  _compute?: Computation<T>;
  /** @internal */
  _flags: number;
  /** @internal */
  _exception?: unknown;
  /** @internal */
  _version: number;
  /** @internal */
  _subs: number;
  /** @internal */
  _firstSource: ListNode<Signal<any>> | null;
  /** @internal */
  _lastSource: ListNode<Signal<any>> | null;
  /** @internal */
  _firstTarget: ListNode<Signal<any> | Subscriber<any>> | null;
  /** @internal */
  _lastTarget: ListNode<Signal<any> | Subscriber<any>> | null;
  /** @internal */
  _firstChild?: ListNode<Signal<any> | (() => any)> | null;
  /** @internal */
  _lastChild?: ListNode<Signal<any> | (() => any)> | null;

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
  const parent = computing || scope;

  this._value = undefined as any;
  this._nextValue = undefined as any;
  this._compute = compute;
  this._flags = 0;
  this._subs = 0;
  this._version = 0;
  this._firstSource = null;
  this._lastSource = null;
  this._firstTarget = null;
  this._lastTarget = null;

  if (options) {
    for (let key in options) {
      (this as any)[key] = (options as any)[key];
    }

    if (this.onCreate && this._compute) {
      runLifecycle(this, 'onCreate', this._value);
    }
  }

  if (parent) createChildNode(parent, this);
}

Signal.prototype.get = function () {
  return get(this, false);
};
Signal.prototype.subscribe = subscribe;
Signal.prototype.pipe = pipe;
Signal.prototype.equal = Object.is;

Object.defineProperty(Signal.prototype, 'value', {
  get() {
    return get(this, false);
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
   * Set the signal value and notify dependents if it was changed.
   * @param value A new value of the signal.
   */
  set(value: T): void;

  /**
   * Set the signal value and force notify dependents.
   * @param value A new value of the signal.
   */
  emit(value: unknown extends T ? void : T): void;

  /**
   * Update the signal value if an update function was passed and force notify dependents.
   * @param updateFn A function that updates the current value or returns a new value.
   */
  update(updateFn?: (lastValue: T) => T | void): void;
}

/** @internal */
function WritableSignal<T>(
  this: Signal<T>,
  value: T,
  options?: SignalOptions<T>
) {
  Signal.call(this as any, undefined, options as any);

  this._value = value;
  this._nextValue = value;

  if (this.onCreate) {
    runLifecycle(this, 'onCreate', value);
  }
}

WritableSignal.prototype = new (Signal as any)();
WritableSignal.prototype.constructor = WritableSignal;
WritableSignal.prototype.set = set;
WritableSignal.prototype.update = update;
WritableSignal.prototype.emit = emit;

/**
 * Calls the passed function and returns the unsubscribe function from all signals and subscriptions created within it.
 * @param fn A function to call.
 * @returns A cleanup function.
 */
export function collect(fn: () => void) {
  const prevComputing = computing;
  const prevScope = scope;
  const fakeState = {} as any as Signal<any>;

  scope = fakeState;
  computing = null;

  try {
    fn();
  } finally {
    computing = prevComputing;
    scope = prevScope;

    return () => cleanupChildren(fakeState);
  }
}

/**
 * Commits all writable signal updates made within the passed function as a single transaction.
 * @param fn A function with updates.
 */
export function batch(fn: (...args: any) => any) {
  ++batchLevel;

  try {
    fn();
  } finally {
    --batchLevel;

    if (providers.length && computing === null && batchLevel === 0) recalc();
  }
}

function set<T>(this: Signal<T>, value?: any) {
  if (value !== undefined) this._nextValue = value;
  providers.push(this);
  if (providers.length && computing === null && batchLevel === 0) recalc();
}

function update<T>(
  this: WritableSignal<T> & Signal<T>,
  updateFn: (value: T) => T
) {
  this._flags |= FORCED;
  this.set(updateFn && updateFn(this._nextValue));
}

function emit<T>(this: WritableSignal<T> & Signal<T>, value: T) {
  this._flags |= FORCED;
  if (arguments.length) this.set(value);
  else this.set(null as any);
}

function notify(signal: Signal<any>) {
  signal._flags |= NOTIFIED;

  if (signal._subs) consumers.push(signal);

  for (let node = signal._firstTarget; node !== null; node = node.next) {
    if (typeof node.value === 'object' && !(node.value._flags & NOTIFIED)) {
      notify(node.value);
    }
  }
}

function pipe(this: Signal<any>, ...operators: Operator<any, any>[]) {
  let result = this;
  for (let op of operators) result = op(result);
  return result;
}

function subscribe<T>(
  this: Signal<T>,
  subscriber: Subscriber<T>,
  immediate = true
) {
  get(this, false);

  if (immediate && !(this._flags & HAS_EXCEPTION)) {
    ++batchLevel;

    try {
      subscriber(this._value, true);
    } catch (e) {
      config.logException(e);
    }

    --batchLevel;

    if (providers.length && computing === null && batchLevel === 0) recalc();
  }

  ++this._subs;
  let node = createTargetNode(this, subscriber, null);

  const dispose = () => {
    if (!node) return;
    removeTargetNode(this, node);
    --this._subs;
    node = null as any;
  };

  const parent = computing || scope;

  if (parent) createChildNode(parent, dispose);

  return dispose;
}

function recalc() {
  const q = providers;
  const nextVersion = version + 1;

  providers = [];

  ++batchLevel;

  for (let signal of q) {
    if (
      signal._flags & FORCED ||
      !signal.equal ||
      !signal.equal(signal._nextValue, signal._value)
    ) {
      version = nextVersion;
      notify(signal);
    }
  }

  for (let signal of consumers) {
    if (signal._subs) get(signal);
  }

  for (let node of staleNodes) {
    removeTargetNode(node.value, node.link);
  }

  for (let signal of notifiers) {
    if (signal._subs) {
      for (let node = signal._firstTarget; node !== null; node = node.next) {
        if (typeof node.value === 'function') {
          try {
            node.value(signal._value, false);
          } catch (e) {
            config.logException(e);
          }
        }
      }
    }
  }

  --batchLevel;

  consumers = [];
  notifiers = [];
  staleNodes = [];

  if (providers.length) recalc();
}

function get<T>(
  signal: Signal<T>,
  trackDependency = true,
  checking?: boolean
): T {
  if (signal._compute) {
    if (signal._flags & FROZEN) return signal._value;

    if (signal._flags & COMPUTING) {
      throw new CircularDependencyError();
    }
  }

  if (signal._version !== version) {
    let needsToUpdate = true;

    signal._flags &= ~CHANGED;

    if (signal._compute) {
      const scheduled = !!(signal._flags & NOTIFIED);

      needsToUpdate = signal._firstSource ? checkSources(signal) : true;
      if (needsToUpdate) compute(signal, scheduled);

      if (signal._flags & HAS_EXCEPTION) {
        needsToUpdate = false;

        if (signal._subs || (!scheduled && !computing && !checking)) {
          config.logException(signal._exception);
        }
      }
    }

    if (
      needsToUpdate &&
      signal._nextValue !== undefined &&
      (signal._flags & FORCED ||
        !signal.equal ||
        !signal.equal(signal._nextValue, signal._value))
    ) {
      const prevValue = signal._value;

      signal._value = signal._nextValue;
      signal._flags |= CHANGED;

      if (signal.onUpdate) {
        runLifecycle(signal, 'onUpdate', signal._value, prevValue);
      }

      if (signal._subs) notifiers.push(signal);
    }
  }

  signal._version = version;
  signal._flags &= ~NOTIFIED & ~FORCED;

  if (computing && trackDependency) {
    const source = computing._lastSource!;
    const hasSource = !(computing._flags & TRACKED);

    if (hasSource) {
      if (source.value !== signal) {
        if (source.link)
          staleNodes.push({
            value: source.value,
            link: source.link,
          });

        source.value = signal;

        if (computing._firstTarget) createTargetNode(signal, computing, source);
        else source.link = null;
      }

      if (source.next) {
        computing._lastSource = source.next;
      } else {
        computing._flags |= TRACKED;
      }
    } else {
      const n = createSourceNode(signal, computing);
      if (computing._firstTarget) createTargetNode(signal, computing, n);
    }
  }

  if (computing) {
    if (signal._flags & HAS_EXCEPTION) throw signal._exception;
  } else if (providers.length && batchLevel === 0) recalc();

  return signal._value;
}

function checkSources(signal: Signal<any>) {
  if (!signal._firstTarget && version - signal._version > 1) return true;

  for (let node = signal._firstSource; node !== null; node = node.next!) {
    const source = node.value;

    if (source._flags & NOTIFIED || source._version !== version) {
      (get as any)(source, false, true);
    }

    if (source._flags & HAS_EXCEPTION) {
      signal._flags |= HAS_EXCEPTION;
      signal._exception = source._exception;
      return true;
    } else if (source._flags & CHANGED) {
      return true;
    }
  }

  signal._flags &= ~HAS_EXCEPTION;

  return false;
}

function compute<T>(signal: Signal<T>, scheduled: boolean) {
  const prevComputing = computing;

  computing = signal;
  signal._lastSource = signal._firstSource;

  signal._flags |= COMPUTING;
  signal._flags &= ~HAS_EXCEPTION;

  if (signal._lastSource) {
    signal._flags &= ~TRACKED;
  } else {
    signal._flags |= TRACKED;
  }

  try {
    if (signal.onCleanup) {
      runLifecycle(signal, 'onCleanup', signal._value);
    }

    if (signal._firstChild) cleanupChildren(signal);

    signal._nextValue = signal._compute!(get as TrackingGetter, scheduled);
  } catch (e: any) {
    signal._exception = e;
    signal._flags |= HAS_EXCEPTION;
  }

  if (signal._flags & HAS_EXCEPTION && signal.onException) {
    runLifecycle(signal, 'onException', signal._exception, signal._value);
  }

  const source = computing._lastSource!;
  const hasSource = !(computing._flags & TRACKED);

  if (hasSource) {
    signal._lastSource = source.prev;

    if (source.link) {
      for (let node = source; node !== null; node = node.next!) {
        removeTargetNode(node.value, node.link!);
      }
    }
  }

  if (signal._lastSource) {
    signal._lastSource.next = null;
  } else {
    signal._flags |= FROZEN;
    signal._firstSource = null;
  }

  signal._flags &= ~COMPUTING;
  computing = prevComputing;
}

function cleanupChildren(signal: Signal<any>) {
  for (let node = signal._firstChild; node; node = node.next) {
    if (typeof node.value === 'function') node.value();
    else cleanupChildren(node.value);
  }

  signal._firstChild = null;
  signal._lastChild = null;
}

function createSourceNode(source: Signal<any>, target: Signal<any>) {
  const node: ListNode<any> = {
    value: source,
    prev: target._lastSource,
    next: null,
    link: null,
  };

  if (!target._lastSource) {
    target._firstSource = node;
  } else {
    target._lastSource.next = node;
  }

  target._lastSource = node;

  return node;
}

function createTargetNode(
  source: Signal<any>,
  target: Signal<any> | Subscriber<any>,
  sourceNode: ListNode<any> | null
) {
  const node: ListNode<any> = {
    value: target,
    prev: source._lastTarget,
    next: null,
  };

  if (source._lastTarget) {
    source._lastTarget.next = node;
  } else {
    source._firstTarget = node;

    for (let n = source._firstSource; n !== null; n = n.next) {
      createTargetNode(n.value, source, n);
    }

    if (source.onActivate) {
      runLifecycle(source, 'onActivate', source._value);
    }
  }

  source._lastTarget = node;
  if (sourceNode) sourceNode.link = node;

  return node;
}

function removeTargetNode(signal: Signal<any>, node: ListNode<any>) {
  if (signal._firstTarget === node) signal._firstTarget = node.next;
  if (signal._lastTarget === node) signal._lastTarget = node.prev;
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  if (!signal._firstTarget) {
    signal._flags &= ~NOTIFIED;

    for (let n = signal._firstSource; n !== null; n = n.next) {
      removeTargetNode(n.value, n.link!);
      n.link = null;
    }

    if (signal.onCleanup) {
      runLifecycle(signal, 'onCleanup', signal._value);
    }

    if (signal.onDeactivate) {
      runLifecycle(signal, 'onDeactivate', signal._value);
    }
  }
}

function createChildNode(
  parent: Signal<any>,
  child: Signal<any> | Subscriber<any>
) {
  const node: ListNode<any> = {
    value: child,
    prev: parent._lastChild || null,
    next: null,
  };

  if (parent._lastChild) {
    parent._lastChild.next = node;
  } else {
    parent._firstChild = node;
  }

  parent._lastChild = node;

  return node;
}

function runLifecycle(
  signal: Signal<any>,
  name: keyof SignalOptions<any>,
  ...args: any[]
) {
  const prevComputing = computing;
  const prevScope = scope;

  computing = null;
  scope = null;

  const res = (signal as any)[name](...args);

  if (res && name === 'onActivate' && typeof res === 'function') {
    (signal as any).onDeactivate = res;
  }

  computing = prevComputing;
  scope = prevScope;
}

export { Signal, WritableSignal };
