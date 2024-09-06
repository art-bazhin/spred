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
let tempNode: ListNode<SignalState<any>> | null = null;

let batchLevel = 0;

let providers: SignalState<any>[] = [];
let consumers: SignalState<any>[] = [];
let notifiers: SignalState<any>[] = [];
let staleNodes: { value: SignalState<any>; link: ListNode<any> }[] = [];

let version = 1;

/**
 * Tracking function that gets the value of the passed signal.
 * @param signal A signal to track.
 */
export type TrackingGetter = <T>(signal: Signal<T>) => T;

/**
 * A function subscribed to updates of a signal.
 * @param value A new value of the signal.
 * @param immediate Determines if the function was executed immediately after subscription.
 * @param returns A cleanup function called after unsubscribing.
 */
export type Subscriber<T> = (value: T, immediate: boolean) => void;

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
   * Calculates and returns the current value of the signal.
   */
  get(): T;

  /**
   * The current value of the signal.
   */
  readonly value: T;
}

/** @internal */
function Signal<T>(
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
    this._options = Object.assign({}, options);

    if (options.hasOwnProperty('equal')) {
      this._equal = options.equal;
    }

    if (this._options?.onCreate && this._compute) {
      runLifecycle(this, 'onCreate', this._value);
    }
  }

  if (parent) createChildNode(parent, this);
}

Signal.prototype.get = function () {
  return get(this as any, false);
};
Signal.prototype.subscribe = subscribe;
(Signal.prototype as any)._equal = Object.is;

Object.defineProperty(Signal.prototype, 'value', {
  get() {
    return this.get();
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
  this: SignalState<T>,
  value: T,
  options?: SignalOptions<T>
) {
  Signal.call(this as any, undefined, options as any);

  this._value = value;
  this._nextValue = value;

  if (this._options?.onCreate) {
    runLifecycle(this, 'onCreate', value);
  }
}

WritableSignal.prototype = new (Signal as any)();
WritableSignal.prototype.constructor = WritableSignal;
WritableSignal.prototype.set = set;
WritableSignal.prototype.update = update;
WritableSignal.prototype.emit = emit;

export interface SignalState<T> extends Signal<T> {
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

  _options: SignalOptions<T>;
  _equal: SignalOptions<T>['equal'];
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

  for (let state of q) {
    if (
      state._flags & FORCED ||
      !state._equal ||
      !state._equal(state._nextValue, state._value)
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

  consumers = [];
  notifiers = [];
  staleNodes = [];

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
        !signal._equal ||
        !signal._equal(signal._nextValue, signal._value))
    ) {
      const prevValue = signal._value;

      signal._value = signal._nextValue;
      signal._flags |= CHANGED;

      if (signal._options?.onUpdate) {
        runLifecycle(signal, 'onUpdate', signal._value, prevValue);
      }

      if (signal._subs) notifiers.push(signal);
    }
  }

  signal._version = version;
  signal._flags &= ~NOTIFIED;
  signal._flags &= ~FORCED;

  if (computing && trackDependency) {
    if (tempNode) {
      if (tempNode.value !== signal) {
        if (tempNode.link)
          staleNodes.push({ value: tempNode.value, link: tempNode.link });

        tempNode.value = signal;

        if (computing._firstTarget)
          createTargetNode(signal, computing, tempNode);
        else tempNode.link = null;
      }

      tempNode = tempNode.next;
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
  const prevTempNode = tempNode;

  computing = state;
  tempNode = state._firstSource;

  state._flags |= COMPUTING;
  state._flags &= ~HAS_EXCEPTION;

  try {
    if (state._options?.onCleanup) {
      runLifecycle(state, 'onCleanup', state._value);
    }

    if (state._firstChild) cleanupChildren(state);

    state._nextValue = state._compute!(get as TrackingGetter, scheduled);
  } catch (e: any) {
    state._exception = e;
    state._flags |= HAS_EXCEPTION;
  }

  if (state._flags & HAS_EXCEPTION && state._options?.onException) {
    runLifecycle(state, 'onException', state._exception, state._value);
  }

  if (tempNode) {
    state._lastSource = tempNode.prev;

    if (tempNode.link) {
      for (let node = tempNode; node !== null; node = node.next!) {
        removeTargetNode(node.value, node.link!);
      }
    }
  }

  if (state._lastSource) {
    state._lastSource.next = null;
  } else {
    state._flags |= FROZEN;
    state._firstSource = null;
  }

  state._flags &= ~COMPUTING;
  computing = prevComputing;
  tempNode = prevTempNode;
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

    if (source._options?.onActivate) {
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

    if (state._options?.onCleanup) {
      runLifecycle(state, 'onCleanup', state._value);
    }

    if (state._options?.onDeactivate) {
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
  name: keyof SignalOptions<any>,
  ...args: any[]
) {
  const prevComputing = computing;
  const prevScope = scope;

  computing = null;
  scope = null;

  const res = (state._options as any)[name](...args);

  if (res && name === 'onActivate' && typeof res === 'function') {
    (state._options as any).onDeactivate = res;
  }

  computing = prevComputing;
  scope = prevScope;
}

export { Signal, WritableSignal };
