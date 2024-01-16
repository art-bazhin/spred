import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { LifecycleHookName } from '../lifecycle/lifecycle';
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

export type Comparator<T> = (value: T, prevValue: T | undefined) => unknown;

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled: boolean) => T);

export interface SignalState<T> {
  value: T;
  nextValue: T;
  flags: number;
  exception?: unknown;
  compute?: Computation<T>;
  catch?: (err: unknown, prevValue?: T) => T;
  compare: Comparator<T>;
  version: any;
  children?: ((() => any) | SignalState<any>)[];
  name?: string;
  subs: number;

  firstSource: ListNode<SignalState<any>> | null;
  lastSource: ListNode<SignalState<any>> | null;

  firstTarget: ListNode<SignalState<any> | Subscriber<any>> | null;
  lastTarget: ListNode<SignalState<any> | Subscriber<any>> | null;

  onActivate?: ((value: T) => any) | null;
  onDeactivate?: ((value: T) => any) | null;
  onUpdate?: ((value: T, prevValue?: T) => any) | null;
  onException?: ((e: unknown) => any) | null;
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
  compare?: Comparator<T> | null,
  handleException?: (e: unknown, prevValue?: T) => T,
): SignalState<T> {
  const parent = tracking || scope;

  const state: SignalState<T> = {
    value,
    compute,
    compare: compare || Object.is,
    catch: handleException,
    nextValue: value,
    flags: 0,
    subs: 0,
    version: null,
    firstSource: null,
    lastSource: null,
    firstTarget: null,
    lastTarget: null,
  };

  if (parent) {
    if (!parent.children) parent.children = [state];
    else parent.children.push(state);
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

export function set<T>(state: SignalState<T>, value: (currentValue: T) => T): T;
export function set<T>(state: SignalState<T>, value: T | undefined): T;
export function set<T>(state: SignalState<T>): void;
export function set<T>(state: SignalState<T>, value?: any) {
  const wrapper = (config as any)._notificationWrapper;

  if (arguments.length > 1) {
    if (typeof value === 'function') state.nextValue = value(state.nextValue);
    else state.nextValue = value;
  } else {
    state.flags |= FORCED;
  }

  if (state.flags & FORCED || !state.compare(state.nextValue, state.value)) {
    providers.push(state);

    if (wrapper) wrapper(recalc);
    else recalc();
  }

  return state.nextValue;
}

function notify(state: SignalState<any>) {
  if (state.flags & NOTIFIED) return;

  state.flags |= NOTIFIED;

  if (state.subs || !state.compute) consumers.push(state);

  for (let node = state.firstTarget; node !== null; node = node.next) {
    if ((node.value as any).version) notify(node.value as any);
  }
}

export function subscribe<T>(
  state: SignalState<T>,
  subscriber: Subscriber<T>,
  exec = true,
) {
  const prevStatus = status;

  if (!(state.flags & FREEZED) && !state.firstTarget) {
    status = ACTIVATING_STATUS;
    state.flags |= ACTIVATING;
  }

  const value = get(state, true);

  status = prevStatus;
  state.flags &= ~ACTIVATING;

  if (state.flags & FREEZED) {
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  let node = createTargetNode(state, subscriber, null);
  state.subs++;

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (!node) return;
    removeTargetNode(state, node);
    state.subs--;
    node = null as any;
  };

  const parent = tracking || scope;

  if (parent) {
    if (!parent.children) parent.children = [dispose];
    else parent.children.push(dispose);
  }

  return dispose;
}

function emitActivateLifecycle(state: SignalState<any>) {
  logHook(state, 'ACTIVATE');

  if (state.onActivate) {
    state.onActivate(state.value);
  }
}

function emitUpdateLifecycle(state: SignalState<any>, value: any) {
  logHook(state, 'UPDATE', value);

  if (state.onUpdate) {
    state.onUpdate(value, state.value);
  }
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
    if (state.subs || !state.compute) get(state);
  }

  status = prevStatus;

  for (let i = 0; i < notifications.length; i += 2) {
    notifications[i](notifications[i + 1]);
  }

  notifications = [];

  --batchLevel;

  recalc();
}

export function get<T>(state: SignalState<T>, notTrackDeps?: boolean): T {
  if (!status) state.flags &= ~NOTIFIED;

  if (state.compute) {
    if (state.flags & FREEZED) return state.value;

    if (state.flags & TRACKING) {
      throw new CircularDependencyError();
    }
  }

  let shouldCompute = state.version !== version;

  if (shouldCompute) {
    state.flags &= ~CHANGED;

    const value = state.compute ? calcComputed(state) : state.nextValue;

    if (state.flags & HAS_EXCEPTION) {
      if ((state.subs || state.flags & ACTIVATING) && state.version !== version)
        config.logException(state.exception);
    } else if (
      state.flags & FORCED ||
      (value !== (VOID as any) && !state.compare(value, state.value))
    ) {
      emitUpdateLifecycle(state, value);

      state.value = value;
      state.flags |= CHANGED;

      if (state.subs) {
        for (let node = state.firstTarget; node !== null; node = node.next) {
          if (!(node.value as any).version)
            notifications.push(node.value, state.value);
        }
      }
    }
  }

  state.version = version;

  state.flags &= ~NOTIFIED;

  if (tracking && !notTrackDeps) {
    if (state.flags & HAS_EXCEPTION && !(tracking.flags & HAS_EXCEPTION)) {
      tracking.exception = state.exception;
      tracking.flags |= HAS_EXCEPTION;
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

  return state.value;
}

function calcComputed<T>(state: SignalState<T>) {
  if (state.firstTarget) {
    let sameDeps = true;
    let hasException = false;

    for (let node = state.firstSource; node !== null; node = node.next) {
      const source = node.value;

      get(source, true);

      if (source.flags & HAS_EXCEPTION) {
        hasException = true;
        state.flags |= HAS_EXCEPTION;
        state.exception = source.exception;
        break;
      } else if (source.flags & CHANGED) {
        sameDeps = false;
        break;
      }
    }

    if (sameDeps && !hasException) {
      return state.value;
    }
  }

  const prevTracking = tracking;
  const prevNode = node;

  let value = state.value;

  tracking = state;
  node = state.firstSource;

  state.flags |= TRACKING;
  state.flags &= ~HAS_EXCEPTION;

  try {
    if (state.children) cleanupChildren(state);
    value = state.compute!(state.value, !!(state.flags & NOTIFIED));
  } catch (e: any) {
    state.exception = e;
    state.flags |= HAS_EXCEPTION;
  }

  if (state.flags & HAS_EXCEPTION) {
    if (state.catch) {
      try {
        value = state.catch(state.exception, state.value);
        state.flags &= ~HAS_EXCEPTION;
        state.exception = undefined;
      } catch (e) {
        state.exception = e;
      }
    }

    if (state.flags & HAS_EXCEPTION) {
      logHook(state, 'EXCEPTION');

      if (state.onException) {
        state.onException(state.exception);
      }
    }
  }

  while (node) {
    removeSourceNode(state, node);
    node = node.next;
  }

  if (!state.firstSource) state.flags |= FREEZED;

  state.flags &= ~TRACKING;
  tracking = prevTracking;
  node = prevNode;

  return value;
}

function cleanupChildren(state: SignalState<any>) {
  if (state.children && state.children.length) {
    for (let child of state.children) {
      if (typeof child === 'function') child();
      else cleanupChildren(child);
    }

    state.children = [];
  }
}

function logHook<T>(state: SignalState<T>, hook: LifecycleHookName, value?: T) {
  if (!state.name) return;

  let payload: any = state.value;

  if (hook === 'EXCEPTION') payload = state.exception;
  else if (hook === 'UPDATE')
    payload = {
      prevValue: state.value,
      value,
    };

  (config as any)._log(state.name, hook, payload);
}

function removeSourceNode(state: SignalState<any>, node: ListNode<any>) {
  if (state.firstSource === node) state.firstSource = node.next;
  if (state.lastSource === node) state.lastSource = node.prev;
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  if (node.link) {
    removeTargetNode(node.value, node.link);
    node.link = null;
  }
}

function removeTargetNode(state: SignalState<any>, node: ListNode<any>) {
  if (state.firstTarget === node) state.firstTarget = node.next;
  if (state.lastTarget === node) state.lastTarget = node.prev;
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  if (!state.firstTarget) {
    logHook(state, 'DEACTIVATE');

    if (state.onDeactivate) {
      state.onDeactivate(state.value);
    }

    unlinkDependencies(state);
  }
}

function createSourceNode(source: SignalState<any>, target: SignalState<any>) {
  const node: ListNode<any> = {
    value: source,
    prev: target.lastSource,
    next: null,
    link: null,
  };

  if (!target.lastSource) {
    target.firstSource = node;
  } else {
    target.lastSource.next = node;
  }

  target.lastSource = node;

  return node;
}

function createTargetNode(
  source: SignalState<any>,
  target: SignalState<any> | Subscriber<any>,
  sourceNode: ListNode<any> | null,
) {
  const node: ListNode<any> = {
    value: target,
    prev: source.lastTarget,
    next: null,
    link: null,
  };

  if (source.lastTarget) {
    source.lastTarget.next = node;
  } else {
    source.firstTarget = node;
    emitActivateLifecycle(source);
    linkDependencies(source);
  }

  source.lastTarget = node;
  if (sourceNode) sourceNode.link = node;

  return node;
}

function linkDependencies(state: SignalState<any>) {
  for (let node = state.firstSource; node !== null; node = node.next) {
    if (!node.link) {
      createTargetNode(node.value, state, node);
      linkDependencies(node.value);
    }
  }
}

function unlinkDependencies(state: SignalState<any>) {
  for (let node = state.firstSource; node !== null; node = node.next) {
    if (node.link) {
      removeTargetNode(node.value, node.link);
      node.link = null;
    }
  }
}
