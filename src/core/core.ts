import { Signal, _Signal } from '../signal/signal';
import { freeze, SignalState } from '../signal-state/signal-state';
import { Subscriber } from '../subscriber/subscriber';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { LifecycleHookName } from '../lifecycle/lifecycle';
import { NOOP_FN } from '../utils/constants';

export let tracking: SignalState<any> | null = null;
export let scope: SignalState<any> | null = null;

let batchLevel = 0;
let calcLevel = 0;
let activateLevel = 0;

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

  let result: true;

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

  state.observers.push(subscriber);

  const subsCount = ++state.subs;
  let index = state.active++;

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (index < 0) return;

    const dif = state.subs - subsCount;
    if (dif < 0) index += dif;

    for (let i = index; i >= 0; i--) {
      if (state.observers[i] === subscriber) {
        state.observers.splice(i, 1);
        --state.subs;
        --state.active;
        index = -1;

        deactivateDependencies(state);

        return;
      }
    }
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
  if (!queueLength || calcLevel || batchLevel) return;

  calcLevel++;
  version++;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];
    let value: any;

    if (!state.compute) {
      if (state.queueIndex !== i) continue;
      value = state.nextValue;
    } else {
      if (!state.active) continue;
      if (state.version !== version) {
        value = calcComputed(state);
        state.version = version;
      }
    }

    const err = state.hasException;

    if (value !== undefined || err) {
      if (!err) {
        emitUpdateLifecycle(state, value);
        state.value = value;
        if (state.subs) notificationQueue.push(state);
      }

      for (let observer of state.observers) {
        if (typeof observer !== 'function') {
          queueLength = queue.push(observer);
        }
      }
    }
  }

  calcLevel--;

  queue = [];
  queueLength = 0;

  notify();
  recalc();
}

function notify() {
  const wrapper = (config as any)._notificationWrapper;

  batchLevel++;

  isolate(() => {
    if (wrapper) {
      wrapper(() => {
        for (let state of notificationQueue) runSubscribers(state);
      });
    } else {
      for (let state of notificationQueue) runSubscribers(state);
    }
  });

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

  for (let i = 0; subsCount && i < state.active; i++) {
    const subscriber = state.observers[i];

    if (typeof subscriber === 'function') {
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
  const shouldUpdate = version !== state.version;

  if (state.isComputing) {
    config.logException(new CircularDependencyError());
    return state.value;
  }

  if (state.compute) {
    if (state.freezed) return state.value;

    if (shouldUpdate) {
      const value = calcComputed(state, notTrackDeps);

      if (value !== undefined) {
        state.value = value;
        if (calcLevel && state.subs) notificationQueue.push(state);
      }

      state.version = version;
    }

    if (!state.dependencies || !state.dependencies.length) {
      freeze(state);
      return state.value;
    }
  }

  if (tracking && !notTrackDeps) {
    if (state.hasException && !tracking.hasException && !tracking.isCatcher) {
      tracking.exception = state.exception;
      tracking.hasException = true;
    }

    if (state.depIndex === -1) {
      tracking.dependencies!.push(state);
    } else {
      state.depIndex = -1;
    }

    if (activateLevel || (calcLevel && shouldUpdate)) {
      if (!state.active) {
        emitActivateLifecycle(state);
      }

      state.active = state.observers.push(tracking);
    }
  }

  return state.value;
}

function calcComputed<T>(state: SignalState<T>, logException?: boolean) {
  const prevTracking = tracking;
  let value;

  cleanupChildren(state);

  const deps = state.dependencies;
  let length = deps.length;

  tracking = state;
  tracking.isComputing = true;
  tracking.hasException = false;

  for (let i = 0; i < length; i++) {
    deps[i].depIndex = i;
  }

  try {
    value = state.compute!(state.value, calcLevel > 0);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  for (let i = 0; i < deps.length; i++) {
    if (deps[i].depIndex >= 0) {
      const dep = deps[i];

      deps[i] = deps[deps.length - 1];
      deps.pop();
      dep.depIndex = -1;
      dep.active--;
      dep.observers.splice(dep.observers.indexOf(state), 1);

      deactivateDependencies(dep);
    }
  }

  tracking.isComputing = false;
  tracking = prevTracking;

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

  logHook(state, 'DEACTIVATE');

  if (state.onDeactivate) {
    state.onDeactivate(state.value);
  }

  if (!state.dependencies) return;

  for (let dependency of state.dependencies) {
    dependency.observers.splice(dependency.observers.indexOf(state), 1);
    --dependency.active;
    deactivateDependencies(dependency);
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
