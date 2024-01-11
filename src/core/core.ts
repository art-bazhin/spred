import { Subscriber } from '../subscriber/subscriber';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { LifecycleHookName } from '../lifecycle/lifecycle';
import {
  ACTIVATING,
  CHANGED,
  FORCED,
  FREEZED,
  HAS_EXCEPTION,
  NOOP_FN,
  NOTIFIED,
  SCHEDULED,
  TRACKING,
  VOID,
} from '../utils/constants';
import { Comparator } from '../compartor/comparator';

export interface ListNode {
  nt: ListNode | null;
  pt: ListNode | null;
  ns: ListNode | null;
  ps: ListNode | null;
  s: SignalState<any>;
  t: SignalState<any> | Subscriber<any>;
}

export type Computation<T> =
  | (() => T)
  | ((prevValue: T | undefined) => T)
  | ((prevValue: T | undefined, scheduled?: boolean) => T);

export interface SignalState<T> {
  value: T;
  nextValue: T;
  flags: number;
  exception?: unknown;
  subs: number;
  compute?: Computation<T>;
  catch?: (err: unknown, prevValue?: T) => T;
  compare: Comparator<T>;
  version?: any;
  children?: ((() => any) | SignalState<any>)[];
  name?: string;

  fs: ListNode | null;
  ls: ListNode | null;
  ft: ListNode | null;
  lt: ListNode | null;
  node: ListNode | null;

  // lifecycle:
  onActivate?: ((value: T) => any) | null;
  onDeactivate?: ((value: T) => any) | null;
  onUpdate?: ((value: T, prevValue?: T) => any) | null;
  onException?: ((e: unknown) => any) | null;
}

let tracking: SignalState<any> | null = null;
let scope: SignalState<any> | null = null;
let node: ListNode | null = null;

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
    node: null,
    fs: null,
    ls: null,
    ft: null,
    lt: null,
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

  for (let node = state.ft; node !== null; node = node.nt) {
    if (typeof node.t === 'object') {
      notify(node.t);
    }
  }
}

export function subscribe<T>(
  state: SignalState<T>,
  subscriber: Subscriber<T>,
  exec = true,
) {
  const prevStatus = status;

  if (!(state.flags & FREEZED) && !state.ft) status = ACTIVATING;

  ++state.subs;

  const value = get(state, true);

  status = prevStatus;

  if (state.flags & FREEZED) {
    --state.subs;
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  let node = createSubscriberNode(state, subscriber);

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (!node) return;
    removeNode(node);
    --state.subs;
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
  status = SCHEDULED;

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
  state.flags &= ~NOTIFIED;

  if (state.compute) {
    if (state.flags & FREEZED) return state.value;

    if (state.flags & TRACKING) {
      throw new CircularDependencyError();
    }
  }

  let shouldCompute =
    state.version !== version || (status && state.compute && !state.fs);

  if (shouldCompute) {
    state.flags &= ~CHANGED;

    const value = state.compute ? calcComputed(state) : state.nextValue;

    if (state.flags & HAS_EXCEPTION) {
      if (state.subs && state.version !== version)
        config.logException(state.exception);
    } else if (
      state.flags & FORCED ||
      (value !== (VOID as any) && !state.compare(value, state.value))
    ) {
      emitUpdateLifecycle(state, value);

      state.value = value;
      state.flags |= CHANGED;

      if (state.subs) {
        for (let node = state.ft; node !== null; node = node.nt) {
          if (typeof node.t === 'function') {
            notifications.push(node.t, state.value);
          }
        }
      }
    }
  }

  state.version = version;

  if (tracking && !notTrackDeps) {
    if (state.flags & HAS_EXCEPTION && !(tracking.flags & HAS_EXCEPTION)) {
      tracking.exception = state.exception;
      tracking.flags |= HAS_EXCEPTION;
    }

    if (status) {
      if (node) {
        if (node.s !== state) {
          if (node.s.ft === node) node.s.ft = node.nt;
          if (node.s.lt === node) node.s.lt = node.pt;
          if (node.pt) node.pt.nt = node.nt;
          if (node.nt) node.nt.pt = node.pt;

          node.nt = null;
          node.pt = state.lt;
          node.s = state;

          if (state.lt) {
            state.lt.nt = node;
          } else {
            state.ft = node;
          }

          state.lt = node;
        }

        node = node.ns;
      } else {
        createNode(state, tracking);
      }
    }
  }

  return state.value;
}

function calcComputed<T>(state: SignalState<T>) {
  let sameDeps = true;
  let hasException = false;

  for (let node = state.fs; node !== null; node = node.ns) {
    const source = node.s;

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

  if (state.fs && sameDeps && !hasException) {
    return state.value;
  }

  const prevTracking = tracking;
  const prevNode = node;

  let value = state.value;

  tracking = state;
  node = state.fs;

  state.flags |= TRACKING;
  state.flags &= ~HAS_EXCEPTION;

  try {
    if (state.children) cleanupChildren(state);
    value = state.compute!(state.value, status === SCHEDULED);
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

  if (status) {
    while (node) {
      removeNode(node);
      node = node.ns;
    }

    if (!state.fs) state.flags |= FREEZED;
  }

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

function createSubscriberNode(
  source: SignalState<any>,
  target: Subscriber<any>,
) {
  const node: ListNode = {
    s: source,
    t: target,
    pt: source.lt,
    nt: null,
  } as any;

  if (source.lt) {
    source.lt.nt = node;
  } else {
    source.ft = node;
    emitActivateLifecycle(node.s);
  }

  source.lt = node;

  return node;
}

function createNode(source: SignalState<any>, target: SignalState<any>) {
  const node: ListNode = {
    s: source,
    t: target,

    ps: target.ls,
    ns: null,

    pt: null,
    nt: null,
  };

  if (target.ls) {
    target.ls.ns = node;
  } else {
    target.fs = node;
  }

  target.ls = node;

  node.pt = source.lt;

  if (source.lt) {
    source.lt.nt = node;
  } else {
    source.ft = node;
    emitActivateLifecycle(node.s);
  }

  source.lt = node;

  return node;
}

function removeNode(node: ListNode) {
  if ((node.t as SignalState<any>).fs === node)
    (node.t as SignalState<any>).fs = node.ns;

  if ((node.t as SignalState<any>).ls === node)
    (node.t as SignalState<any>).ls = node.ps;

  if (node.ps) node.ps.ns = node.ns;
  if (node.ns) node.ns.ps = node.ps;

  if (node.s.ft === node) node.s.ft = node.nt;
  if (node.s.lt === node) node.s.lt = node.pt;

  if (node.pt) node.pt.nt = node.nt;
  if (node.nt) node.nt.pt = node.pt;

  if (!node.s.ft) {
    const state = node.s;

    logHook(state, 'DEACTIVATE');

    if (state.onDeactivate) {
      state.onDeactivate(state.value);
    }

    for (let node = state.fs; node !== null; node = node.ns) {
      removeNode(node);
    }
  }
}
