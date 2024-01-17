import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import {
  ACTIVATING,
  ACTIVATING_STATUS,
  CHANGED,
  FORCED,
  FREEZED,
  HAS_EXCEPTION,
  NOOP_FN,
  NOTIFIED,
  SCHEDULED_STATUS,
  TRACKING,
  VOID,
} from '../utils/constants';

interface ListNode<T> {
  value: T;
  link: ListNode<T> | null;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
}

export type Subscriber<T> = (value: T, exec?: boolean) => any;

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled: boolean) => T);

export interface SignalOptions<T> {
  name?: string;
  equals?: (value: T, prevValue?: T) => unknown;
  catch?: (err: unknown, prevValue?: T) => T;
  onActivate?: (value: T) => any;
  onDeactivate?: (value: T) => any;
  onUpdate?: (value: T, prevValue?: T) => any;
  onException?: (e: unknown) => any;
}

export interface SignalState<T> extends SignalOptions<T> {
  _value: T;
  _nextValue: T;
  _compute?: Computation<T>;
  _flags: number;
  _exception?: unknown;
  _version: any;
  _children?: ((() => any) | SignalState<any>)[];
  _subs: number;

  _firstSource: ListNode<SignalState<any>> | null;
  _lastSource: ListNode<SignalState<any>> | null;

  _firstTarget: ListNode<SignalState<any> | Subscriber<any>> | null;
  _lastTarget: ListNode<SignalState<any> | Subscriber<any>> | null;
}

let tracking: SignalState<any> | null = null;
let scope: SignalState<any> | null = null;
let node: ListNode<SignalState<any>> | null = null;

let batchLevel = 0;
let status = 0;

let providers: SignalState<any>[] = [];
let consumers: SignalState<any>[] = [];
let notifications: any[] = [];

let version = {};

export function createSignalState<T>(
  value: T,
  compute?: Computation<T>,
  options?: SignalOptions<T>,
): SignalState<T> {
  const parent = tracking || scope;

  const state: SignalState<T> = {
    _value: value,
    _compute: compute,
    _nextValue: value,
    _flags: 0,
    _subs: 0,
    _version: null,
    _firstSource: null,
    _lastSource: null,
    _firstTarget: null,
    _lastTarget: null,
    equals: Object.is,
  };

  if (options) {
    for (let key in options) {
      (state as any)[key] = (options as any)[key];
    }
  }

  if (parent) {
    if (!parent._children) parent._children = [state];
    else parent._children.push(state);
  }

  return state;
}

export function isolate<T>(fn: () => T): T;
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A,
): T;
export function isolate(fn: any, args?: any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevStatus = status;

  let result: any;

  if (tracking) scope = tracking;
  status = 0;
  tracking = null;

  if (args) result = fn(...args);
  else result = fn();

  tracking = prevTracking;
  scope = prevScope;
  status = prevStatus;

  return result;
}

export function collect(fn: () => any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevStatus = status;
  const fakeState = {} as any as SignalState<any>;

  status = 0;
  scope = fakeState;
  tracking = null;

  fn();

  tracking = prevTracking;
  scope = prevScope;
  status = prevStatus;

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

export function set<T>(state: SignalState<T>, value: T): T;
export function set<T>(state: SignalState<T>): void;
export function set<T>(state: SignalState<T>, value?: any) {
  const wrapper = (config as any)._notificationWrapper;

  if (arguments.length > 1) {
    state._nextValue = value;
  } else {
    state._flags |= FORCED;
  }

  providers.push(state);

  if (wrapper) wrapper(recalc);
  else recalc();

  return state._nextValue;
}

function notify(state: SignalState<any>) {
  if (state._flags & NOTIFIED) return;

  state._flags |= NOTIFIED;

  if (!state._compute) get(state);
  if (state._subs) consumers.push(state);

  for (let node = state._firstTarget; node !== null; node = node.next) {
    if (typeof node.value === 'object') notify(node.value);
  }
}

export function subscribe<T>(
  state: SignalState<T>,
  subscriber: Subscriber<T>,
  exec = true,
) {
  const prevStatus = status;

  if (!(state._flags & FREEZED) && !state._firstTarget) {
    status = ACTIVATING_STATUS;
    state._flags |= ACTIVATING;
  }

  const value = get(state, false);

  status = prevStatus;
  state._flags &= ~ACTIVATING;

  if (state._flags & FREEZED) {
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  let node = createTargetNode(state, subscriber, null);
  state._subs++;

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (!node) return;
    removeTargetNode(state, node);
    state._subs--;
    node = null as any;
  };

  const parent = tracking || scope;

  if (parent) {
    if (!parent._children) parent._children = [dispose];
    else parent._children.push(dispose);
  }

  return dispose;
}

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc() {
  if (!providers.length || batchLevel) return;

  const q = providers;
  const prevStatus = status;

  providers = [];
  consumers = [];
  version = {};
  status = SCHEDULED_STATUS;

  ++batchLevel;

  for (let state of q) notify(state);
  for (let state of consumers) {
    if (state._subs || !state._compute) get(state);
  }

  status = prevStatus;

  for (let i = 0; i < notifications.length; i += 2) {
    notifications[i](notifications[i + 1]);
  }

  notifications = [];

  --batchLevel;

  recalc();
}

export function get<T>(state: SignalState<T>, trackDependency = true): T {
  if (!status) state._flags &= ~NOTIFIED;

  if (state._compute) {
    if (state._flags & FREEZED) return state._value;

    if (state._flags & TRACKING) {
      throw new CircularDependencyError();
    }
  }

  let shouldCompute = state._version !== version;

  if (shouldCompute) {
    state._flags &= ~CHANGED;

    const value = state._compute ? calcComputed(state) : state._nextValue;

    if (state._flags & HAS_EXCEPTION) {
      if (
        (state._subs || state._flags & ACTIVATING) &&
        state._version !== version
      )
        config.logException(state._exception);
    } else if (
      state._flags & FORCED ||
      (value !== (VOID as any) && !state.equals!(value, state._value))
    ) {
      if (state.onUpdate) state.onUpdate(value, state._value);

      state._value = value;
      state._flags |= CHANGED;

      if (state._subs) {
        for (let node = state._firstTarget; node !== null; node = node.next) {
          if (typeof node.value === 'function')
            notifications.push(node.value, state._value);
        }
      }
    }
  }

  state._version = version;

  state._flags &= ~NOTIFIED;

  if (tracking && trackDependency) {
    if (state._flags & HAS_EXCEPTION && !(tracking._flags & HAS_EXCEPTION)) {
      tracking._exception = state._exception;
      tracking._flags |= HAS_EXCEPTION;
    }

    if (node) {
      if (node.value !== state) {
        if (node.link) removeTargetNode(node.value, node.link);

        node.value = state;

        if (status) createTargetNode(state, tracking, node);
        else node.link = null;
      }

      node = node.next;
    } else {
      const n = createSourceNode(state, tracking);
      if (status) createTargetNode(state, tracking, n);
    }
  }

  return state._value;
}

function calcComputed<T>(state: SignalState<T>) {
  if (state._firstTarget) {
    let sameDeps = true;
    let hasException = false;

    for (let node = state._firstSource; node !== null; node = node.next) {
      const source = node.value;

      get(source, false);

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

  const prevTracking = tracking;
  const prevNode = node;

  let value = state._value;

  tracking = state;
  node = state._firstSource;

  state._flags |= TRACKING;
  state._flags &= ~HAS_EXCEPTION;

  try {
    if (state._children) cleanupChildren(state);
    value = state._compute!(state._value, !!(state._flags & NOTIFIED));
  } catch (e: any) {
    state._exception = e;
    state._flags |= HAS_EXCEPTION;
  }

  if (state._flags & HAS_EXCEPTION) {
    if (state.catch) {
      try {
        value = state.catch(state._exception, state._value);
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
  tracking = prevTracking;
  node = prevNode;

  return value;
}

function cleanupChildren(state: SignalState<any>) {
  if (state._children && state._children.length) {
    for (let child of state._children) {
      if (typeof child === 'function') child();
      else cleanupChildren(child);
    }

    state._children = [];
  }
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
    link: null,
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

function linkDependencies(state: SignalState<any>) {
  for (let node = state._firstSource; node !== null; node = node.next) {
    if (!node.link) {
      createTargetNode(node.value, state, node);
      linkDependencies(node.value);
    }
  }
}

function unlinkDependencies(state: SignalState<any>) {
  for (let node = state._firstSource; node !== null; node = node.next) {
    if (node.link) {
      removeTargetNode(node.value, node.link);
      node.link = null;
    }
  }
}
