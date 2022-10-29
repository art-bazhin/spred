import { Signal } from '../signal/signal';
import { ListNode, SignalState } from '../signal-state/signal-state';
import { Subscriber } from '../subscriber/subscriber';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { LifecycleHookName } from '../lifecycle/lifecycle';
import { NOOP_FN } from '../utils/constants';

export let tracking: SignalState<any> | null = null;
export let scope: SignalState<any> | null = null;

let node: ListNode | null = null;

let batchLevel = 0;
let status = 0;

const ACTIVATING = 1;
const SCHEDULED = 2;

let queue: SignalState<any>[] = [];
let notifications: any[] = [];

let version = {};

export function isolate<T>(fn: () => T): T;
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A
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

export function update<T>(
  state: SignalState<T>,
  value: (currentValue: T) => T
): T;
export function update<T>(state: SignalState<T>, value: T | undefined): T;
export function update<T>(state: SignalState<T>): void;
export function update<T>(state: SignalState<T>, value?: any) {
  const wrapper = (config as any)._notificationWrapper;

  if (arguments.length > 1) {
    if (typeof value === 'function') state.nextValue = value(state.nextValue);
    else state.nextValue = value;
  } else {
    state.forced = true;
  }

  state.i = queue.push(state) - 1;

  if (wrapper) wrapper(recalc);
  else recalc();

  return state.nextValue;
}

export function subscribe<T>(
  this: Signal<T>,
  subscriber: Subscriber<T>,
  exec = true
) {
  const state = (this as any)._state as SignalState<T>;
  const prevStatus = status;

  if (!state.freezed && !state.ft) status = ACTIVATING;

  const value = getStateValue(state, true);

  status = prevStatus;

  if (state.freezed) {
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  let node = createSubscriberNode(state, subscriber);
  ++state.subs;

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
    state.onUpdate({
      value: value,
      prevValue: state.value,
    });
  }
}

function getFiltered<T>(value: T, state: SignalState<T>) {
  const filter = state.filter;
  const prevValue = state.value;

  if (filter)
    return typeof filter === 'function' ? filter(value, prevValue) : true;

  return !Object.is(value, prevValue);
}

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc() {
  if (!queue.length || batchLevel) return;

  const q = queue;
  const firstIndex = queue.length;
  const prevStatus = status;

  queue = [];
  version = {};
  status = SCHEDULED;

  ++batchLevel;

  for (let i = 0; i < q.length; i++) {
    const state = q[i];

    if (state.i !== i) continue;

    let filtered = true;
    let isWritable = !state.compute;

    if (isWritable) {
      filtered = getFiltered(state.nextValue, state) || state.forced;
      state.forced = false;

      if (filtered) {
        emitUpdateLifecycle(state, state.nextValue);
        state.value = state.nextValue;
      }
    }

    if (filtered) {
      for (let node = state.ft; node !== null; node = node.nt) {
        if (typeof node.t === 'object') {
          ++node.t.dirty;
          node.t.i = q.push(node.t) - 1;
        } else if (isWritable) {
          notifications.push(node.t);
          notifications.push(state.value);
        }
      }
    }
  }

  for (let i = firstIndex; i < q.length; i++) {
    const state = q[i];

    if (state.i !== i || state.version === version || !state.ft) continue;

    let value = state.value;
    let filtered = false;

    if (state.dirty) {
      value = calcComputed(state);
      filtered = getFiltered(value, state) || state.hasException;
    }

    if (filtered) {
      if (!state.hasException) {
        emitUpdateLifecycle(state, value);
        state.value = value;

        let subsCount = state.subs;

        for (let node = state.ft; subsCount && node !== null; node = node.nt!) {
          if (typeof node.t === 'function') {
            notifications.push(node.t);
            notifications.push(state.value);
            --subsCount;
          }
        }
      }
    } else {
      for (let node = state.ft; node !== null; node = node.nt!) {
        if (typeof node.t === 'object') --node.t.dirty;
      }
    }

    state.version = version;
    state.dirty = 0;
  }

  status = prevStatus;

  notify();
  --batchLevel;

  recalc();
}

function notify() {
  for (let i = 0; i < notifications.length; i += 2) {
    notifications[i](notifications[i + 1]);
  }

  notifications = [];
}

export function getStateValue<T>(
  state: SignalState<T>,
  notTrackDeps?: boolean
): T {
  if (state.compute) {
    if (state.freezed) return state.value;

    if (state.tracking) {
      throw new CircularDependencyError();
    }

    let shouldCompute = !state.ft && (status || state.version !== version);

    if (shouldCompute) {
      const value = calcComputed(state, notTrackDeps);
      if (getFiltered(value, state)) state.value = value;
    }

    state.version = version;
  }

  if (tracking && !notTrackDeps) {
    if (state.hasException && !tracking.hasException) {
      tracking.exception = state.exception;
      tracking.hasException = true;
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

function calcComputed<T>(state: SignalState<T>, logException?: boolean) {
  const prevTracking = tracking;
  const prevNode = node;

  let value = state.value;

  if (state.children) cleanupChildren(state);

  tracking = state;
  node = state.fs;

  state.tracking = true;
  state.hasException = false;

  try {
    value = state.compute!(state.value, status === SCHEDULED);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  if (state.hasException) {
    if (state.catch) {
      try {
        value = state.catch(state.exception, state.value);
        state.hasException = false;
        state.exception = undefined;
      } catch (e) {
        state.exception = e;
      }
    }

    if (state.hasException) {
      logHook(state, 'EXCEPTION');

      if (state.onException) {
        state.onException(state.exception);
      }

      if (logException || state.subs || (!state.ft && !tracking)) {
        config.logException(state.exception);
      }
    }
  }

  if (status) {
    while (node) {
      removeNode(node);
      node = node.nt;
    }

    if (!state.fs) state.freezed = true;
  }

  state.tracking = false;
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
  target: Subscriber<any>
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

function createNode(
  source: SignalState<any>,
  target: SignalState<any>,
  shouldActivate?: any
) {
  const node: ListNode = {
    s: source,
    t: target,

    ps: target.ls,
    ns: null,

    pt: null,
    nt: null,

    stale: false,
    cached: 0,
  };

  if (target.ls) {
    target.ls.ns = node;
  } else {
    target.fs = node;
  }

  target.ls = node;

  if (true) {
    node.pt = source.lt;

    if (source.lt) {
      source.lt.nt = node;
    } else {
      source.ft = node;
      emitActivateLifecycle(node.s);
    }

    source.lt = node;
  }

  return node;
}

function removeNode(node: ListNode, unlinkSources?: boolean) {
  if (true) {
    if ((node.t as SignalState<any>).fs === node)
      (node.t as SignalState<any>).fs = node.ns;

    if ((node.t as SignalState<any>).ls === node)
      (node.t as SignalState<any>).ls = node.ps;

    if (node.ps) node.ps.ns = node.ns;
    if (node.ns) node.ns.ps = node.ps;
  }

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
