import { Signal, _Signal } from '../signal/signal';
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
let activateLevel = 0;
let calculating = false;

let queue: SignalState<any>[] = [];
let nextQueue: SignalState<any>[] = [];

let version = 0;

export function isolate<T>(fn: () => T): T;
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A
): T;
export function isolate(fn: any, args?: any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivating = activateLevel;

  let result: any;

  if (tracking) scope = tracking;
  activateLevel = 0;
  tracking = null;

  if (args) result = fn(...args);
  else result = fn();

  tracking = prevTracking;
  scope = prevScope;
  activateLevel = prevActivating;

  return result;
}

export function collect(fn: () => any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivating = activateLevel;
  const fakeState = {} as any as SignalState<any>;

  activateLevel = 0;
  scope = fakeState;
  tracking = null;

  fn();

  tracking = prevTracking;
  scope = prevScope;
  activateLevel = prevActivating;

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
  const q = calculating ? nextQueue : queue;

  if (arguments.length > 1) {
    if (typeof value === 'function') state.nextValue = value(state.nextValue);
    else state.nextValue = value;
  } else {
    state.forced = true;
  }

  state.i = q.push(state) - 1;

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

  // if (!state.freezed && !state.ft)

  ++activateLevel;

  const value = getStateValue(state, true);

  --activateLevel;

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

  ++batchLevel;
  calculating = true;
  ++version;

  for (let i = 0; i < queue.length; i++) {
    const state = queue[i];

    let value = state.value;
    let forced: boolean | undefined;

    if (state.compute) {
      if (state.version === version || !state.ft) continue;
      ++activateLevel;
      value = calcComputed(state);
      --activateLevel;
      state.version = version;
    } else {
      if (state.i !== i) continue;
      forced = state.forced;
      value = state.nextValue;
    }

    const err = state.hasException;

    if (getFiltered(value, state) || err || forced) {
      if (!err) {
        emitUpdateLifecycle(state, value);
        state.value = value;
      }

      for (let node = state.ft; node !== null; node = node.nt) {
        if (typeof node.t === 'object') queue.push(node.t);
        else if (!err) node.t(node.s.value);
      }

      if (forced) state.forced = false;
    }
  }

  calculating = false;
  --batchLevel;

  queue = nextQueue;
  nextQueue = [];

  recalc();
}

function runSubscribers<T>(state: SignalState<T>) {
  let subsCount = state.subs;

  for (let node = state.ft; subsCount && node !== null; node = node.nt) {
    if (typeof node.t === 'function') {
      node.t(state.value);
      --subsCount;
    }
  }
}

export function getStateValue<T>(
  state: SignalState<T>,
  notTrackDeps?: boolean
): T {
  if (state.compute) {
    // if (state.freezed) return state.value;

    if (state.tracking) {
      throw new CircularDependencyError();
    }

    let shouldCompute = state.version !== version;
    if (activateLevel) shouldCompute = shouldCompute || !state.ft;

    if (shouldCompute) {
      const value = calcComputed(state, notTrackDeps);

      if (getFiltered(value, state)) {
        state.value = value;
        if (calculating && state.subs) runSubscribers(state);
      }

      state.version = version;
    }
  }

  if (tracking && !notTrackDeps) {
    if (state.hasException && !tracking.hasException) {
      tracking.exception = state.exception;
      tracking.hasException = true;
    }

    if (activateLevel) {
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

  // for (let node = state.fs; node !== null; node = node.ns) {
  //   node.s.node = node;
  //   node.stale = true;
  // }

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

  if (activateLevel) {
    while (node) {
      removeNode(node);
      node = node.nt;
    }
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
