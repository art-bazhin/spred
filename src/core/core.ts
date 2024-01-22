import { config } from '../config/config';
import { CircularDependencyError } from '../common/errors';
import {
  ACTIVATING,
  CHANGED,
  FORCED,
  FREEZED,
  HAS_EXCEPTION,
  NOOP_FN,
  NOTIFIED,
  TRACKING,
} from '../common/constants';

interface ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
  link?: ListNode<T> | null;
}

let computing: SignalState<any> | null = null;
let scope: SignalState<any> | null = null;
let node: ListNode<SignalState<any>> | null = null;

let batchLevel = 0;
let shouldLink = false;

let providers: SignalState<any>[] = [];
let consumers: SignalState<any>[] = [];
let notifications: any[] = [];

let version = 1;

/**
 * A function subscribed to updates of a signal.
 * @param value A new value of the signal.
 * @param exec Determines whether the function has been executed immediately after subscription.
 * @param returns A cleanup function called after unsubscribing.
 */
export type Subscriber<T> = (value: T, exec: boolean) => (() => any) | any;

/**
 * A function that calculates the new value of the signal.
 * @param prevValue A previous value of the signal.
 * @param scheduled Has a true value if the recalculation was caused by a dependency change or the setter call.
 */
export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined, scheduled: boolean) => T);

/**
 * An object that stores the options of the signal to be created.
 */
export interface SignalOptions<T> {
  /**
   * An equality function used to check whether the value of the signal has been changed. Default is Object.is.
   * @param value A new value of the signal.
   * @param prevValue A previous value of the signal.
   * @returns Truthy if the values are equal, falsy otherwise.
   */
  equal?: (value: T, prevValue?: T) => unknown;

  /**
   * A function that catches exceptions that occurred during the calculation of the signal value. Returns a new signal value and stops the exception propagation.
   * @param e An exception.
   * @param prevValue A previous value of the signal.
   * @returns A new value of the signal.
   */
  catch?: (e: unknown, prevValue?: T) => T;

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
   * A function called whenever an exception occurs during the calculation of the signal value.
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
  subscribe(subscriber: Subscriber<T>, exec?: boolean): () => void;

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
  this._firstTarget = null;
  this._lastTarget = null;

  if (options) {
    for (let key in options) {
      (this as any)[key] = (options as any)[key];
    }
  }

  if (parent) createChildNode(parent, this);
}

_Signal.prototype.get = get;
_Signal.prototype.subscribe = subscribe;
_Signal.prototype.equal = Object.is;

/**
 * A {@link Signal} whose value can be set.
 */
export interface WritableSignal<T> extends Signal<T> {
  /**
   * Set the value of the signal
   * @param value A new value of the signal.
   * @returns The value has been set.
   */
  set(value: T): T;

  /**
   * Notify subscribers without setting a new value.
   * @returns The last value has been set.
   */
  set(): T;

  /**
   * Calculate and set a new signal value based on the the last set value.
   * @param getNextValue A function that calculates a new value.
   * @returns The value has been set.
   */
  update(getNextValue: (lastValue: T) => T): T;
}

export function _WritableSignal<T>(
  this: SignalState<T>,
  value: T,
  options?: SignalOptions<T>
) {
  _Signal.call(this as any, undefined, options as any);

  this._value = value;
  this._nextValue = value;
}

_WritableSignal.prototype = new (_Signal as any)();
_WritableSignal.prototype.constructor = _WritableSignal;
_WritableSignal.prototype.set = set;
_WritableSignal.prototype.update = update;

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
  const prevShouldLink = shouldLink;

  let result: any;

  if (computing) scope = computing;
  shouldLink = false;
  computing = null;

  if (args) result = fn(...args);
  else result = fn();

  computing = prevComputing;
  scope = prevScope;
  shouldLink = prevShouldLink;

  return result;
}

/**
 * Calls the passed function and returns the unsubscribe function from all signals and subscriptions created within it.
 * @param fn A function to call.
 * @returns A cleanup function.
 */
export function collect(fn: () => void) {
  const prevComputing = computing;
  const prevScope = scope;
  const prevShouldLink = shouldLink;
  const fakeState = {} as any as SignalState<any>;

  shouldLink = false;
  scope = fakeState;
  computing = null;

  fn();

  computing = prevComputing;
  scope = prevScope;
  shouldLink = prevShouldLink;

  return () => cleanupChildren(fakeState);
}

/**
 * Commits all writable signal updates made within the passed function as a single transaction.
 * @param fn A function with updates.
 */
export function batch(fn: (...args: any) => any) {
  const wrapper = (config as any)._notificationWrapper;

  ++batchLevel;
  fn();
  --batchLevel;

  if (wrapper) wrapper(recalc);
  else recalc();
}

function set<T>(this: SignalState<T>, value: T): T;
function set<T>(this: SignalState<T>): void;
function set<T>(this: SignalState<T>, value?: any) {
  const wrapper = (config as any)._notificationWrapper;

  if (arguments.length) {
    this._nextValue = value;
  } else {
    this._flags |= FORCED;
  }

  providers.push(this);

  if (wrapper) wrapper(recalc);
  else recalc();

  return this._nextValue;
}

function update<T>(this: any, updateFn: (value: T) => T) {
  return this.set(updateFn(this._nextValue));
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
  let cleanup: any = undefined;

  const prevShouldLink = shouldLink;
  const runSubscriber = () => {
    batch(() => {
      try {
        cleanup = subscriber(value, true);
      } catch (e) {
        config.logException(e);
      }
    });
  };

  if (!(this._flags & FREEZED) && !this._firstTarget) {
    shouldLink = true;
    this._flags |= ACTIVATING;
  }

  const value = this.get(false);

  shouldLink = prevShouldLink;
  this._flags &= ~ACTIVATING;

  if (this._flags & FREEZED) {
    if (exec) isolate(runSubscriber);
    return NOOP_FN;
  }

  let node = createTargetNode(this, subscriber, null);
  ++this._subs;

  if (exec) isolate(runSubscriber);

  const dispose = () => {
    if (!node) return;
    removeTargetNode(this, node);
    --this._subs;
    node = null as any;
    if (typeof cleanup === 'function') cleanup();
  };

  const parent = computing || scope;

  if (parent) createChildNode(parent, dispose);

  return dispose;
}

function recalc() {
  if (!providers.length || batchLevel) return;

  const q = providers;
  const prevShouldLink = shouldLink;

  providers = [];
  consumers = [];
  shouldLink = true;

  ++version;
  ++batchLevel;

  for (let state of q) {
    if (
      state._flags & FORCED ||
      (state._nextValue !== undefined &&
        !state.equal!(state._nextValue, state._value))
    ) {
      notify(state);
    }
  }

  for (let state of consumers) {
    if (state._subs) state.get();
  }

  shouldLink = prevShouldLink;

  for (let i = 0; i < notifications.length; i += 2) {
    try {
      notifications[i](notifications[i + 1]);
    } catch (e) {
      config.logException(e);
    }
  }

  notifications = [];

  --batchLevel;

  recalc();
}

function get<T>(this: SignalState<T>, trackDependency = true): T {
  if (this._compute) {
    if (this._flags & FREEZED) return this._value;

    if (this._flags & TRACKING) {
      throw new CircularDependencyError();
    }
  }

  if (this._version !== version) {
    const sourcesChanged = checkSources(this);

    this._flags &= ~CHANGED;

    if (this._compute && sourcesChanged) compute(this);

    if (this._flags & HAS_EXCEPTION) {
      if (this._subs || this._flags & ACTIVATING)
        config.logException(this._exception);
    } else if (
      this._flags & FORCED ||
      (sourcesChanged &&
        this._nextValue !== undefined &&
        !this.equal!(this._nextValue, this._value))
    ) {
      const prevValue = this._value;

      this._value = this._nextValue;
      this._flags |= CHANGED;

      if (this.onUpdate) this.onUpdate(this._value, prevValue);

      if (this._subs) {
        for (let node = this._firstTarget; node !== null; node = node.next) {
          if (typeof node.value === 'function')
            notifications.push(node.value, this._value);
        }
      }
    }
  }

  this._version = version;
  this._flags &= ~NOTIFIED;
  this._flags &= ~FORCED;

  if (computing && trackDependency) {
    if (this._flags & HAS_EXCEPTION && !(computing._flags & HAS_EXCEPTION)) {
      computing._exception = this._exception;
      computing._flags |= HAS_EXCEPTION;
    }

    if (node) {
      if (node.value !== this) {
        if (node.link) removeTargetNode(node.value, node.link);

        node.value = this;

        if (shouldLink) createTargetNode(this, computing, node);
        else node.link = null;
      }

      node = node.next;
    } else {
      const n = createSourceNode(this, computing);
      if (shouldLink) createTargetNode(this, computing, n);
    }
  }

  return this._value;
}

function checkSources(state: SignalState<any>) {
  if (state._firstSource) {
    let sameSources = true;
    let hasException = false;

    for (let node = state._firstSource; node !== null; node = node.next!) {
      const source = node.value;

      if (!(state._flags & NOTIFIED) && source._version !== state._version) {
        sameSources = false;
        break;
      }

      source.get(false);

      if (source._flags & HAS_EXCEPTION) {
        hasException = true;
        state._flags |= HAS_EXCEPTION;
        state._exception = source._exception;
        break;
      } else if (source._flags & CHANGED) {
        sameSources = false;
        break;
      }
    }

    if (sameSources && !hasException) {
      return false;
    }
  }

  return true;
}

function compute<T>(state: SignalState<T>) {
  const scheduled = !!(state._flags & NOTIFIED);
  const prevComputing = computing;
  const prevNode = node;

  computing = state;
  node = state._firstSource;

  state._flags |= TRACKING;
  state._flags &= ~HAS_EXCEPTION;

  try {
    if (state._firstChild) cleanupChildren(state);
    state._nextValue = state._compute!(state._value, scheduled);
  } catch (e: any) {
    state._exception = e;
    state._flags |= HAS_EXCEPTION;
  }

  if (state._flags & HAS_EXCEPTION) {
    if (state.catch) {
      try {
        state._nextValue = state.catch(state._exception, state._value);
        state._flags &= ~HAS_EXCEPTION;
        state._exception = undefined;
      } catch (e) {
        state._exception = e;
      }
    }

    if (state._flags & HAS_EXCEPTION && state.onException) {
      state.onException(state._exception, state._value);
    }
  }

  while (node) {
    removeSourceNode(state, node);
    node = node.next;
  }

  if (!state._firstSource) state._flags |= FREEZED;

  state._flags &= ~TRACKING;
  computing = prevComputing;
  node = prevNode;
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

function removeSourceNode(state: SignalState<any>, node: ListNode<any>) {
  if (state._firstSource === node) state._firstSource = node.next;
  if (state._lastSource === node) state._lastSource = node.prev;
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  if (node.link) {
    removeTargetNode(node.value, node.link);
    node.link = null;
  }
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
    linkDependencies(source);
    if (source.onActivate) source.onActivate(source._value);
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
    unlinkDependencies(state);
    if (state.onDeactivate) state.onDeactivate(state._value);
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

function linkDependencies(state: SignalState<any>) {
  for (let node = state._firstSource; node !== null; node = node.next) {
    if (!node.link) {
      createTargetNode(node.value, state, node);
      linkDependencies(node.value);
    }
  }
}

function unlinkDependencies(state: SignalState<any>) {
  state._flags &= ~NOTIFIED;

  for (let node = state._firstSource; node !== null; node = node.next) {
    if (node.link) {
      removeTargetNode(node.value, node.link);
      node.link = null;
    }
  }
}
