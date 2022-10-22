import { Signal, _Signal } from '../signal/signal';
import { SignalState } from '../signal-state/signal-state';
import { Subscriber } from '../subscriber/subscriber';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { LifecycleHookName } from '../lifecycle/lifecycle';
import { NOOP_FN } from '../utils/constants';

export let tracking: SignalState<any> | null = null;
export let scope: SignalState<any> | null = null;

let batchLevel = 0;
let activateLevel = 0;
let trackingId = -1;
let lastTrackingId = -1;
let calcActive = false;

let queue: SignalState<any>[] = [];
let queueLength = 0;
let notificationQueue: SignalState<any>[] = [];

let version = 0;

export function isolate<T>(fn: () => T): T;
export function isolate<T, A extends unknown[]>(
  fn: (...args: A) => T,
  args: A
): T;
export function isolate(fn: any, args?: any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivateLevel = activateLevel;
  const prevTrackingId = trackingId;

  let result: true;

  activateLevel = 0;
  if (tracking) scope = tracking;
  tracking = null;

  if (args) result = fn(...args);
  else result = fn();

  tracking = prevTracking;
  scope = prevScope;
  activateLevel = prevActivateLevel;
  trackingId = prevTrackingId;

  return result;
}

export function collect(fn: () => any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const prevActivateLevel = activateLevel;
  const prevTrackingId = trackingId;
  const fakeState = {} as any as SignalState<any>;

  activateLevel = 0;
  scope = fakeState;
  tracking = null;

  fn();

  tracking = prevTracking;
  scope = prevScope;
  activateLevel = prevActivateLevel;
  trackingId = prevTrackingId;

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

  state.queueIndex = queueLength;
  queueLength = queue.push(state);

  recalc();

  return state.nextValue;
}

export function subscribe<T>(
  this: Signal<T>,
  subscriber: Subscriber<T>,
  exec = true
) {
  const state = (this as any)._state as SignalState<T>;

  if (!state.active) ++activateLevel;

  const value = getStateValue(state, true);

  if (!state.active) {
    --activateLevel;
    emitActivateLifecycle(state);
  }

  if (state.freezed) {
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  const index = state.observers.push(subscriber) - 1;

  ++state.subs;
  ++state.active;

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (!state.observers[index]) return;

    state.observers[index] = undefined as any;
    --state.subs;
    --state.active;

    deactivateDependencies(state);
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

  if (!state.onUpdate) return;

  state.onUpdate({
    value: value,
    prevValue: state.value,
  });
}

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc() {
  if (!queueLength || calcActive || batchLevel) return;

  calcActive = true;
  ++version;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    let value = state.value;

    if (!state.compute) {
      if (state.queueIndex !== i) continue;
      value = state.nextValue;
      state.version = version;
    } else {
      if (!state.active) continue;
      if (state.version !== version) {
        value = calcComputed(state);
        state.version = version;
      } else continue;
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

      for (let observer of state.observers) {
        if (observer && typeof observer === 'object') {
          queueLength = queue.push(observer);
        }
      }

      if (forced) state.forced = false;
    }
  }

  calcActive = false;

  queue = [];
  queueLength = 0;

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

  for (let subscriber of state.observers) {
    if (!subsCount) break;

    if (subscriber && typeof subscriber === 'function') {
      subscriber(state.value);
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
  if (!tracking) {
    trackingId = -1;
    lastTrackingId = -1;
  }

  const shouldUpdate = version !== state.version;

  if (state.isComputing) {
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

      state.version = version;
    }

    if (!state.dependencies.length) {
      state.freezed = true;
      return state.value;
    }
  }

  if (tracking && !notTrackDeps && state.depIndex !== trackingId) {
    if (state.hasException && !tracking.hasException && !tracking.isCatcher) {
      tracking.exception = state.exception;
      tracking.hasException = true;
    }

    const lookup = tracking.lookup;
    let depIndex = state.depIndex;

    if (depIndex < 0) {
      depIndex = tracking.dependencies.push(state) - 1;
    }

    if ((activateLevel || shouldUpdate) && lookup[depIndex] === undefined) {
      if (!state.active) {
        emitActivateLifecycle(state);
      }

      const obsIndex = state.observers.push(tracking) - 1;
      lookup[depIndex] = obsIndex;
      state.active++;
    }

    state.depIndex = trackingId;
  }

  return state.value;
}

function calcComputed<T>(state: SignalState<T>, logException?: boolean) {
  const prevTrackingId = trackingId;
  const prevTracking = tracking;
  let value = state.value;

  cleanupChildren(state);

  const deps = state.dependencies;
  const lookup = state.lookup;
  let length = deps.length;

  tracking = state;
  tracking.isComputing = true;
  tracking.hasException = false;
  trackingId = --lastTrackingId;

  for (let i = 0; i < length; i++) {
    deps[i].depIndex = i;
  }

  try {
    value = state.compute!(state.value, calcActive);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];

    if (deps[i].depIndex >= 0) {
      deps[i] = deps[deps.length - 1];
      deps.pop();
      dep.active--;

      dep.observers[lookup[i]] = undefined as any;
      lookup[i] = lookup[lookup.length - 1];
      lookup.pop();

      deactivateDependencies(dep);
    }

    dep.depIndex = -1;
  }

  tracking.isComputing = false;
  tracking = prevTracking;
  trackingId = prevTrackingId;

  if (state.hasException) {
    logHook(state, 'EXCEPTION');

    if (state.onException) {
      state.onException(state.exception);
    }

    if (logException || state.subs || (!state.active && !tracking)) {
      config.logException(state.exception);
    }
  }

  return value;
}

function deactivateDependencies<T>(state: SignalState<T>) {
  if (state.freezed || state.active) return;

  state.observers = [];

  logHook(state, 'DEACTIVATE');

  if (state.onDeactivate) {
    state.onDeactivate(state.value);
  }

  const deps = state.dependencies;
  const lookup = state.lookup;

  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    const index = lookup[i];

    dep.observers[index] = undefined as any;
    --dep.active;
    deactivateDependencies(dep);
  }
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
