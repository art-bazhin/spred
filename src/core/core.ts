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
let activateLevel = 0;
let calcActive = false;

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
  const prevActivateLevel = activateLevel;

  let result: any;

  activateLevel = 0;
  if (tracking) scope = tracking;
  tracking = null;

  if (args) result = fn(...args);
  else result = fn();

  tracking = prevTracking;
  scope = prevScope;
  activateLevel = prevActivateLevel;

  return result;
}

export function collect(fn: () => any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivateLevel = activateLevel;
  const fakeState = {} as any as SignalState<any>;

  activateLevel = 0;
  scope = fakeState;
  tracking = null;

  fn();

  tracking = prevTracking;
  scope = prevScope;
  activateLevel = prevActivateLevel;

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
  const activating = !state.freezed && !state.ft;

  if (activating) ++activateLevel;

  const value = getStateValue(state, true);

  if (activating) --activateLevel;

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

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc() {
  if (!queue.length || calcActive || batchLevel) return;

  calcActive = true;
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
    const filter = state.filter;
    let filtered = false;

    if (filter) filtered = filter(value, state.value);
    else if (filter === false) filtered = true;
    else filtered = !Object.is(value, state.value);

    if (forced || filtered || err) {
      if (!err) {
        emitUpdateLifecycle(state, value);
        state.value = value;
        if (state.subs) notificationQueue.push(state);
      }

      let node = state.ft;

      while (node) {
        if (typeof node.t === 'object') queue.push(node.t);
        node = node.nt;
      }

      if (forced) state.forced = false;
    }
  }

  calcActive = false;
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
  const shouldUpdate = version !== state.version;

  if (state.tracking) {
    config.logException(new CircularDependencyError());
    return state.value;
  }

  if (state.compute) {
    if (state.freezed) return state.value;

    if (shouldUpdate) {
      const value = calcComputed(state, notTrackDeps);
      let filtered = false;

      if (state.filter) filtered = state.filter(value, state.value);
      else filtered = !Object.is(value, state.value);

      if (filtered) {
        state.value = value;
        if (calcActive && state.subs) notificationQueue.push(state);
      }
    } else if (activateLevel) {
      let n = state.fs;

      while (n) {
        activateNode(n);
        n = n.ns;
      }
    }

    if (!state.fs) {
      state.freezed = true;
      return state.value;
    }
  }

  state.version = version;

  if (tracking && !notTrackDeps) {
    const activating = activateLevel || calcActive;

    if (state.hasException && !tracking.hasException && !tracking.isCatcher) {
      tracking.exception = state.exception;
      tracking.hasException = true;
    }

    let node = state.node;

    if (node === null) {
      node = createNode(state, tracking, activating);
      state.node = node;
    } else if (node.t !== tracking) {
      nodeCache.push(node);
      node = createNode(state, tracking, activating);
      ++node.cached;
      state.node = node;
    } else if (activating && !(node.pt || node.nt || node.s.lt === node)) {
      activateNode(node);
    }

    node.stale = false;
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
  let node = state.fs;

  while (node) {
    node.s.node = node;
    node.stale = true;
    node = node.ns;
  }

  try {
    value = state.compute!(state.value, calcActive);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  node = state.ls;

  while (node) {
    const ps = node.ps;

    if (node.cached) {
      node.s.node = nodeCache.pop()!;
      --node.cached;
    } else {
      node.s.node = null;
    }

    if (node.stale) removeNode(node, true);

    node = ps;
  }

  state.tracking = false;
  tracking = prevTracking;

  if (state.hasException) {
    logHook(state, 'EXCEPTION');

    if (state.onException) {
      state.onException(state.exception);
    }

    if (logException || state.subs || (!state.ft && !tracking)) {
      config.logException(state.exception);
    }
  }

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
  activating?: any
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

  if (activating) {
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

function activateNode(node: ListNode) {
  if (node.pt || node.nt || node.s.lt === node) return;

  if (activateLevel) {
    let n = node.s.fs;

    while (n) {
      activateNode(n);
      n = n.ns;
    }
  }

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

    node.ps = null;
    node.ns = null;
  }

  if (node.s.ft === node) node.s.ft = node.nt;
  if (node.s.lt === node) node.s.lt = node.pt;

  if (node.pt) node.pt.nt = node.nt;
  if (node.nt) node.nt.pt = node.pt;

  node.pt = null;
  node.nt = null;

  if (!node.s.ft) {
    const state = node.s;

    logHook(state, 'DEACTIVATE');

    if (state.onDeactivate) {
      state.onDeactivate(state.value);
    }

    let n = state.fs;

    while (n) {
      const ns = n.ns;
      removeNode(n);
      n = ns;
    }
  }
}
