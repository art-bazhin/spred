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
  VOID,
} from '../common/constants';

interface ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
  link?: ListNode<T> | null;
}

export type Subscriber<T> = (value: T, exec?: boolean) => any;

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled: boolean) => T);

/**
 * Basic reactive primitive.
 */
export interface Signal<T> {
  /**
   * Calculates and returns the current value of the signal.
   */
  get(): T;

  /**
   * Calculates and returns the current value of the signal.
   */
  get(trackDependency: boolean): T;

  /**
   * Subscribes the function to updates of the signal value.
   * @param subscriber A function that listens to updates.
   * @param exec Determines whether the function should be called immediately after subscription.
   * @returns Unsubscribe function.
   */
  subscribe<E extends boolean>(subscriber: Subscriber<T>, exec: E): () => void;

  /**
   * Subscribes the function to updates of the signal value and calls it immediately.
   * @param subscriber A function that listens to updates.
   * @returns Unsubscribe function.
   */
  subscribe(subscriber: Subscriber<T>): () => void;
}

export interface SignalOptions<T> {
  name?: string;
  equals?: (value: T, prevValue?: T) => unknown;
  catch?: (err: unknown, prevValue?: T) => T;
  onActivate?: (value: T) => any;
  onDeactivate?: (value: T) => any;
  onUpdate?: (value: T, prevValue?: T) => any;
  onException?: (e: unknown) => any;
}

export interface SignalState<T> extends SignalOptions<T>, Signal<T> {
  _value: T;
  _nextValue: T;
  _compute?: Computation<T>;
  _flags: number;
  _exception?: unknown;
  _version: any;
  _subs: number;

  _firstSource: ListNode<SignalState<any>> | null;
  _lastSource: ListNode<SignalState<any>> | null;

  _firstTarget: ListNode<SignalState<any> | Subscriber<any>> | null;
  _lastTarget: ListNode<SignalState<any> | Subscriber<any>> | null;

  _firstChild?: ListNode<SignalState<any> | (() => any)> | null;
  _lastChild?: ListNode<SignalState<any> | (() => any)> | null;
}

let computing: SignalState<any> | null = null;
let scope: SignalState<any> | null = null;
let node: ListNode<SignalState<any>> | null = null;

let batchLevel = 0;
let shouldLink = false;

let providers: SignalState<any>[] = [];
let consumers: SignalState<any>[] = [];
let notifications: any[] = [];

let version = {};

export function Signal<T>(
  this: SignalState<T>,
  value: T,
  compute?: Computation<T>,
  options?: SignalOptions<T>,
) {
  const parent = computing || scope;

  this._value = value;
  this._compute = compute;
  this._nextValue = value;
  this._flags = 0;
  this._subs = 0;
  this._version = null;
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

Signal.prototype.get = get;
Signal.prototype.set = set;
Signal.prototype.update = update;
Signal.prototype.subscribe = subscribe;
Signal.prototype.equals = Object.is;

export function isolate<T>(fn: () => T): T;
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A,
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

export function collect(fn: () => any) {
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
 * Commits all writable signal updates inside the passed function as a single transaction.
 * @param fn The function with updates.
 */
export function batch(fn: (...args: any) => any) {
  const wrapper = (config as any)._notificationWrapper;

  batchLevel++;
  fn();
  batchLevel--;

  if (wrapper) wrapper(recalc);
  else recalc();
}

export function set<T>(this: SignalState<T>, value: T): T;
export function set<T>(this: SignalState<T>): void;
export function set<T>(this: SignalState<T>, value?: any) {
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
  if (state._flags & NOTIFIED) return;

  state._flags |= NOTIFIED;

  if (state._subs) consumers.push(state);

  for (let node = state._firstTarget; node !== null; node = node.next) {
    if (typeof node.value === 'object') notify(node.value);
  }
}

export function subscribe<T>(
  this: SignalState<T>,
  subscriber: Subscriber<T>,
  exec = true,
) {
  const prevShouldLink = shouldLink;

  if (!(this._flags & FREEZED) && !this._firstTarget) {
    shouldLink = true;
    this._flags |= ACTIVATING;
  }

  const value = this.get(false);

  shouldLink = prevShouldLink;
  this._flags &= ~ACTIVATING;

  if (this._flags & FREEZED) {
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  let node = createTargetNode(this, subscriber, null);
  this._subs++;

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (!node) return;
    removeTargetNode(this, node);
    this._subs--;
    node = null as any;
  };

  const parent = computing || scope;

  if (parent) createChildNode(parent, dispose);

  return dispose;
}

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc() {
  if (!providers.length || batchLevel) return;

  const q = providers;
  const prevShouldLink = shouldLink;

  providers = [];
  consumers = [];
  version = {};
  shouldLink = true;

  ++batchLevel;

  for (let state of q) notify(state);
  for (let state of consumers) {
    if (state._subs || !state._compute) state.get();
  }

  shouldLink = prevShouldLink;

  for (let i = 0; i < notifications.length; i += 2) {
    notifications[i](notifications[i + 1]);
  }

  notifications = [];

  --batchLevel;

  recalc();
}

export function get<T>(this: SignalState<T>, trackDependency = true): T {
  if (this._compute) {
    if (this._flags & FREEZED) return this._value;

    if (this._flags & TRACKING) {
      throw new CircularDependencyError();
    }
  }

  if (this._version !== version) {
    this._flags &= ~CHANGED;

    if (this._compute) compute(this);

    if (this._flags & HAS_EXCEPTION) {
      if (this._subs || this._flags & ACTIVATING)
        config.logException(this._exception);
    } else if (
      this._flags & FORCED ||
      (this._nextValue !== (VOID as any) &&
        !this.equals!(this._nextValue, this._value))
    ) {
      if (this.onUpdate) this.onUpdate(this._nextValue, this._value);

      this._value = this._nextValue;
      this._flags |= CHANGED;

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

function compute<T>(state: SignalState<T>) {
  const scheduled = !!(state._flags & NOTIFIED);

  if (state._firstSource) {
    let sameDeps = true;
    let hasException = false;

    for (let node = state._firstSource; node !== null; node = node.next!) {
      const source = node.value;

      if (!scheduled && source._version !== state._version) {
        sameDeps = false;
        break;
      }

      source.get(false);

      if (source._flags & HAS_EXCEPTION) {
        hasException = true;
        state._flags |= HAS_EXCEPTION;
        state._exception = source._exception;
        break;
      } else if (source._flags & CHANGED) {
        sameDeps = false;
        break;
      }
    }

    if (sameDeps && !hasException) {
      return state._value;
    }
  }

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
      state.onException(state._exception);
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
  sourceNode: ListNode<any> | null,
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

function createChildNode(
  parent: SignalState<any>,
  child: SignalState<any> | Subscriber<any>,
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
