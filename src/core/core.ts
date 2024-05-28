import { config } from '../config/config';
import { CircularDependencyError } from '../common/errors';
import {
  CHANGED,
  FORCED,
  FROZEN,
  HAS_EXCEPTION,
  NOTIFIED,
  COMPUTING,
} from '../common/constants';

interface ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
  link?: ListNode<T> | null;
}

let computing: SignalState<any> | null = null;
let scope: SignalState<any> | null = null;

let batchLevel = 0;

let providers: SignalState<any>[] = [];
let consumers: SignalState<any>[] = [];
let notifiers: SignalState<any>[] = [];
let staleNodes: { value: SignalState<any>; link: ListNode<any> }[] = [];

let version = 1;

// TODO DOCS
export type TrackingGetter = <T>(signal: Signal<T>) => T;

/**
 * A function subscribed to updates of a signal.
 * @param value A new value of the signal.
 * @param exec Determines if the function was executed immediately after subscription.
 * @param returns A cleanup function called after unsubscribing.
 */
export type Subscriber<T> = (value: T, exec: boolean) => void;

/**
 * A function that calculates the new value of the signal.
 * @param get Tracking function to get values of other signals.
 * @param scheduled Determines if the recalculation was caused by a dependency update.
 */
export type Computation<T> = (get: TrackingGetter, scheduled: boolean) => T;

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
  equal?: (value: T, prevValue?: T) => unknown;

  /**
   * A function called at the moment the signal is created.
   * @param value An initial value of the signal.
   */
  onCreate?: (value?: T) => void;

  /**
   * A function called when the first subscriber or the first active dependent signal appears.
   * @param value A current value of the signal.
   */
  onActivate?: (value: T) => void;

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
   * A function called whenever an unhandled exception occurs during the calculation of the signal value.
   * @param e An exception.
   * @param prevValue A previous value of the signal.
   */
  onException?: (e: unknown, prevValue?: T) => void;
}

/**
 * A basic reactive primitive. Notifies consumers of a change in the stored value and triggers them to recalculate.
 */
export interface Signal<T> {
  /**
   * Subscribes the passed function to updates of the signal value.
   * @param subscriber A function subscribed to updates.
   * @param exec Determines whether the function should be executed immediately after subscription. Default is true.
   * @returns An unsubscribe function.
   */
  subscribe<E extends boolean>(
    subscriber: Subscriber<true extends E ? T : Exclude<T, undefined>>,
    exec?: E
  ): () => void;

  /**
   * Calculates and returns the current value of the signal.
   * @param track Determines whether the signal should be tracked as a dependency. Default is true.
   */
  get(track?: boolean): T;
}

export function _Signal<T>(
  this: SignalState<T>,
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
  this._source = null;
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

_Signal.prototype.get = function (...args: any) {
  return get(this, ...args);
};
_Signal.prototype.subscribe = subscribe;
_Signal.prototype.equal = Object.is;

/**
 * A {@link Signal} whose value can be set.
 */
export interface WritableSignal<T> extends Signal<T> {
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

export function _WritableSignal<T>(
  this: SignalState<T>,
  value: T,
  options?: SignalOptions<T>
) {
  _Signal.call(this as any, undefined, options as any);

  this._value = value;
  this._nextValue = value;

  if (this.onCreate) {
    runLifecycle(this, 'onCreate', value);
  }
}

_WritableSignal.prototype = new (_Signal as any)();
_WritableSignal.prototype.constructor = _WritableSignal;
_WritableSignal.prototype.set = set;
_WritableSignal.prototype.update = update;
_WritableSignal.prototype.emit = emit;

export interface SignalState<T> extends SignalOptions<T>, Signal<T> {
  _value: T;
  _nextValue: T;
  _compute?: Computation<T>;
  _flags: number;
  _exception?: unknown;
  _version: number;
  _subs: number;

  _firstSource: ListNode<SignalState<any>> | null;
  _lastSource: ListNode<SignalState<any>> | null;
  _source: ListNode<SignalState<any>> | null;

  _firstTarget: ListNode<SignalState<any> | Subscriber<any>> | null;
  _lastTarget: ListNode<SignalState<any> | Subscriber<any>> | null;

  _firstChild?: ListNode<SignalState<any> | (() => any)> | null;
  _lastChild?: ListNode<SignalState<any> | (() => any)> | null;
}

/**
 * Calls the passed function without tracking dependencies.
 * @param fn A function to call.
 * @returns A result of the function call.
 */
export function isolate<T>(fn: () => T): T;

/**
 * Calls the passed function without tracking dependencies.
 * @param fn A function to call.
 * @param args Function arguments.
 * @returns A result of the function call.
 */
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A
): T;

export function isolate(fn: any, args?: any) {
  const prevComputing = computing;
  const prevScope = scope;

  if (computing) scope = computing;
  computing = null;

  try {
    if (args) return fn(...args);
    return fn();
  } finally {
    computing = prevComputing;
    scope = prevScope;
  }
}

/**
 * Calls the passed function and returns the unsubscribe function from all signals and subscriptions created within it.
 * @param fn A function to call.
 * @returns A cleanup function.
 */
export function collect(fn: () => void) {
  const prevComputing = computing;
  const prevScope = scope;
  const fakeState = {} as any as SignalState<any>;

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

function set<T>(this: SignalState<T>, value?: any) {
  if (value !== undefined) this._nextValue = value;
  providers.push(this);
  if (providers.length && computing === null && batchLevel === 0) recalc();
}

function update<T>(
  this: WritableSignal<T> & SignalState<T>,
  updateFn: (value: T) => T
) {
  this._flags |= FORCED;
  this.set(updateFn && updateFn(this._nextValue));
}

function emit<T>(this: WritableSignal<T> & SignalState<T>, value: T) {
  this._flags |= FORCED;
  if (arguments.length) this.set(value);
  else this.set(null as any);
}

function notify(state: SignalState<any>) {
  state._flags |= NOTIFIED;

  if (state._subs) consumers.push(state);

  for (let node = state._firstTarget; node !== null; node = node.next) {
    if (typeof node.value === 'object' && !(node.value._flags & NOTIFIED)) {
      notify(node.value);
    }
  }
}

function subscribe<T>(
  this: SignalState<T>,
  subscriber: Subscriber<T>,
  exec = true
) {
  get(this, false);

  if (exec && !(this._flags & HAS_EXCEPTION)) {
    ++batchLevel;

    isolate(() => {
      try {
        subscriber(this._value, true);
      } catch (e) {
        config.logException(e);
      }
    });

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
  consumers = [];
  notifiers = [];
  staleNodes = [];

  ++batchLevel;

  for (let state of q) {
    if (
      state._flags & FORCED ||
      !state.equal!(state._nextValue, state._value)
    ) {
      version = nextVersion;
      notify(state);
    }
  }

  for (let state of consumers) {
    if (state._subs) get(state);
  }

  for (let node of staleNodes) {
    removeTargetNode(node.value, node.link);
  }

  for (let state of notifiers) {
    if (state._subs) {
      for (let node = state._firstTarget; node !== null; node = node.next) {
        if (typeof node.value === 'function') {
          try {
            node.value(state._value, false);
          } catch (e) {
            config.logException(e);
          }
        }
      }
    }
  }

  --batchLevel;

  if (providers.length) recalc();
}

function get<T>(
  signal: SignalState<T>,
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
        !signal.equal!(signal._nextValue, signal._value))
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
  signal._flags &= ~NOTIFIED;
  signal._flags &= ~FORCED;

  if (computing && trackDependency) {
    const node = computing._source;

    if (node) {
      if (node.value !== signal) {
        if (node.link) staleNodes.push({ value: node.value, link: node.link });

        node.value = signal;

        if (computing._firstTarget) createTargetNode(signal, computing, node);
        else node.link = null;
      }

      computing._source = node.next;
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

function checkSources(state: SignalState<any>) {
  if (!state._firstTarget && version - state._version > 1) return true;

  for (let node = state._firstSource; node !== null; node = node.next!) {
    const source = node.value;

    if (source._flags & NOTIFIED || source._version !== version) {
      (get as any)(source, false, true);
    }

    if (source._flags & HAS_EXCEPTION) {
      state._flags |= HAS_EXCEPTION;
      state._exception = source._exception;
      return true;
    } else if (source._flags & CHANGED) {
      return true;
    }
  }

  state._flags &= ~HAS_EXCEPTION;

  return false;
}

function compute<T>(state: SignalState<T>, scheduled: boolean) {
  const prevComputing = computing;

  computing = state;
  state._source = state._firstSource;

  state._flags |= COMPUTING;
  state._flags &= ~HAS_EXCEPTION;

  try {
    if (state._firstChild) cleanupChildren(state);
    state._nextValue = state._compute!(get as TrackingGetter, scheduled);
  } catch (e: any) {
    state._exception = e;
    state._flags |= HAS_EXCEPTION;
  }

  if (state._flags & HAS_EXCEPTION && state.onException) {
    runLifecycle(state, 'onException', state._exception, state._value);
  }

  if (state._source) {
    state._lastSource = state._source.prev;

    if (state._source.link) {
      for (let node = state._source; node !== null; node = node.next!) {
        removeTargetNode(node.value, node.link!);
      }
    }

    state._source = null;
  }

  if (state._lastSource) {
    state._lastSource.next = null;
  } else {
    state._flags |= FROZEN;
    state._firstSource = null;
  }

  state._flags &= ~COMPUTING;
  computing = prevComputing;
}

function cleanupChildren(state: SignalState<any>) {
  for (let node = state._firstChild; node; node = node.next) {
    if (typeof node.value === 'function') node.value();
    else cleanupChildren(node.value);
  }

  state._firstChild = null;
  state._lastChild = null;
}

function createSourceNode(source: SignalState<any>, target: SignalState<any>) {
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
  source: SignalState<any>,
  target: SignalState<any> | Subscriber<any>,
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

function removeTargetNode(state: SignalState<any>, node: ListNode<any>) {
  if (state._firstTarget === node) state._firstTarget = node.next;
  if (state._lastTarget === node) state._lastTarget = node.prev;
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  if (!state._firstTarget) {
    state._flags &= ~NOTIFIED;

    for (let n = state._firstSource; n !== null; n = n.next) {
      removeTargetNode(n.value, n.link!);
      n.link = null;
    }

    if (state.onDeactivate) {
      runLifecycle(state, 'onDeactivate', state._value);
    }
  }
}

function createChildNode(
  parent: SignalState<any>,
  child: SignalState<any> | Subscriber<any>
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
  state: SignalState<any>,
  name: keyof SignalState<any>,
  ...args: any[]
) {
  const prevComputing = computing;
  const prevScope = scope;

  computing = null;
  scope = null;

  state[name](...args);

  computing = prevComputing;
  scope = prevScope;
}
