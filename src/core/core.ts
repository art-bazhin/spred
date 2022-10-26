import { Signal, _Signal } from '../signal/signal';
import { ListNode, SignalState } from '../signal-state/signal-state';
import { Subscriber } from '../subscriber/subscriber';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { LifecycleHookName } from '../lifecycle/lifecycle';
import { NOOP_FN } from '../utils/constants';

export let tracking: SignalState<any> | null = null;
export let scope: SignalState<any> | null = null;

let batchLevel = 0;

let activating = false;
let calculating = false;

let queue: SignalState<any>[] = [];
let notificationQueue: SignalState<any>[] = [];
let nodeCache: ListNode[] = [];

let version = {};

export function isolate<T>(fn: () => T): T;
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A
): T;
export function isolate(fn: any, args?: any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivating = activating;

  let result: any;

  if (tracking) scope = tracking;
  activating = false;
  tracking = null;

  if (args) result = fn(...args);
  else result = fn();

  tracking = prevTracking;
  scope = prevScope;
  activating = prevActivating;

  return result;
}

export function collect(fn: () => any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivating = activating;
  const fakeState = {} as any as SignalState<any>;

  activating = false;
  scope = fakeState;
  tracking = null;

  fn();

  tracking = prevTracking;
  scope = prevScope;
  activating = prevActivating;

  return () => cleanupChildren(fakeState);
}

/**
 * Commits all writable signal updates inside the passed function as a single transaction.
 * @param fn The function with updates.
 */
export function batch(fn: (...args: any) => any) {
  batchLevel++;
  fn();
  batchLevel--;

  recalc();
}

export function update<T>(
  state: SignalState<T>,
  value: (currentValue: T) => T
): T;
export function update<T>(state: SignalState<T>, value: T | undefined): T;
export function update<T>(state: SignalState<T>): void;
export function update<T>(state: SignalState<T>, value?: any) {
  if (arguments.length > 1) {
    if (typeof value === 'function') state.nextValue = value(state.nextValue);
    else state.nextValue = value;
  } else {
    state.forced = true;
  }

  state.i = queue.push(state) - 1;

  recalc();

  return state.nextValue;
}

export function subscribe<T>(
  this: Signal<T>,
  subscriber: Subscriber<T>,
  exec = true
) {
  const state = (this as any)._state as SignalState<T>;
  const prevActivating = activating;

  if (!state.freezed && !state.ft) activating = true;

  const value = getStateValue(state, true);

  activating = prevActivating;

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
  if (!queue.length || calculating || batchLevel) return;

  calculating = true;
  version = {};

  for (let i = 0; i < queue.length; i++) {
    const state = queue[i];

    let value = state.value;

    if (state.compute) {
      if (!state.ft) continue;
      if (state.version !== version) {
        value = calcComputed(state);
        state.version = version;
      } else continue;
    } else {
      if (state.i !== i) continue;
      value = state.nextValue;
      state.version = version;
    }

    const err = state.hasException;
    const forced = state.forced;
    const filtered = getFiltered(value, state);

    if (forced || filtered || err) {
      if (!err) {
        emitUpdateLifecycle(state, value);
        state.value = value;
        if (state.subs) notificationQueue.push(state);
      }

      for (let node = state.ft; node !== null; node = node.nt) {
        if (typeof node.t === 'object') queue.push(node.t);
      }

      if (forced) state.forced = false;
    }
  }

  calculating = false;
  queue = [];

  notify();
  recalc();
}

function notify() {
  const wrapper = (config as any)._notificationWrapper;

  batchLevel++;

  if (wrapper) {
    wrapper(() => {
      for (let state of notificationQueue) runSubscribers(state);
    });
  } else {
    for (let state of notificationQueue) runSubscribers(state);
  }

  notificationQueue = [];

  batchLevel--;
}

function runSubscribers<T>(state: SignalState<T>) {
  let subsCount = state.subs;
  if (!subsCount) return;

  const value = state.value;

  logHook(state, 'NOTIFY_START');

  if (state.onNotifyStart) {
    state.onNotifyStart(value);
  }

  for (let node = state.ft; subsCount && node !== null; node = node.nt) {
    if (typeof node.t === 'function') {
      node.t(state.value);
      --subsCount;
    }
  }

  logHook(state, 'NOTIFY_END');

  if (state.onNotifyEnd) {
    state.onNotifyEnd(value);
  }
}

export function getStateValue<T>(
  state: SignalState<T>,
  notTrackDeps?: boolean
): T {
  const shouldCompute = version !== state.version;

  if (state.compute) {
    if (state.freezed) return state.value;

    if (state.tracking) {
      config.logException(new CircularDependencyError());
      return state.value;
    }

    if (shouldCompute) {
      const value = calcComputed(state, notTrackDeps);

      if (getFiltered(value, state)) {
        state.value = value;
        if (calculating && state.subs) notificationQueue.push(state);
      }
    } else if (activating) activate(state);

    if (!state.fs) {
      state.freezed = true;
      return state.value;
    }
  }

  state.version = version;

  if (tracking && !notTrackDeps) {
    const shouldActivate = activating || calculating;

    if (state.hasException && !tracking.hasException) {
      tracking.exception = state.exception;
      tracking.hasException = true;
    }

    const node = state.node;

    if (node && node.t === tracking) {
      if (shouldActivate) activateNode(node);
      node.stale = false;
    } else {
      if (node) {
        nodeCache.push(node);
        ++node.cached;
      }

      state.node = createNode(state, tracking, shouldActivate);
    }
  }

  return state.value;
}

function calcComputed<T>(state: SignalState<T>, logException?: boolean) {
  const prevTracking = tracking;
  let value = state.value;

  if (state.children) cleanupChildren(state);

  tracking = state;

  state.tracking = true;
  state.hasException = false;

  for (let node = state.fs; node !== null; node = node.ns) {
    node.s.node = node;
    node.stale = true;
  }

  try {
    value = state.compute!(state.value, calculating);
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

  for (let node = state.ls; node !== null; node = node.ps) {
    if (node.cached) {
      node.s.node = nodeCache.pop()!;
      --node.cached;
    } else {
      node.s.node = null;
    }

    if (node.stale) removeNode(node, true);
  }

  state.tracking = false;
  tracking = prevTracking;

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

  if (shouldActivate) {
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

function activate(state: SignalState<any>) {
  for (let node = state.fs; node !== null; node = node.ns) {
    activateNode(node);
  }
}

function activateNode(node: ListNode) {
  if (node.pt || node.nt || node.s.lt === node) return;
  if (activating) activate(node.s);

  if (node.s.lt) {
    node.s.lt.nt = node;
    node.pt = node.s.lt;
  } else {
    node.s.ft = node;
    node.s.lt = node;
    emitActivateLifecycle(node.s);
  }

  return node;
}

function removeNode(node: ListNode, unlinkSources?: boolean) {
  if (unlinkSources) {
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
