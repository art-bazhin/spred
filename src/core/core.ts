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

  let result: true;

  if (tracking) scope = tracking;
  tracking = null;

  if (args) result = fn(...args);
  else result = fn();
  tracking = prevTracking;
  scope = prevScope;

  return result;
}

export function collect(fn: () => any) {
  const prevTracking = tracking;
  const prevScope = scope;
  const fakeState = {} as any as SignalState<any>;

  scope = fakeState;
  tracking = null;

  fn();

  tracking = prevTracking;
  scope = prevScope;

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
  const value = getStateValue(state, true);

  if (state.freezed) {
    if (exec) isolate(() => subscriber(value, true));
    return NOOP_FN;
  }

  activateDependencies(state);

  if (state.observers) {
    state.observers.push(subscriber);
  } else {
    state.observers = [subscriber];
  }

  const subsCount = ++state.subsCount;
  let index = state.obsCount++;

  if (exec) {
    isolate(() => subscriber(value, true));
  }

  const dispose = () => {
    if (index < 0) return;

    const dif = state.subsCount - subsCount;
    if (dif < 0) index += dif;

    // const lastIndex = state.observers!.length - 1;
    // if (lastIndex < index) index = lastIndex;

    for (let i = index; i >= 0; i--) {
      if (state.observers![i] === subscriber) {
        state.observers!.splice(i, 1);
        --state.subsCount;
        --state.obsCount;
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
    } else if (state.version !== version && state.obsCount) {
      value = calcComputed(state);
      state.version = version;
    }

    const err = state.hasException;

    if (value !== undefined || err) {
      if (!err) {
        emitUpdateLifecycle(state, value);
        state.value = value;
        if (state.subsCount) notificationQueue.push(state);
      }

      if (state.observers) {
        for (let observer of state.observers) {
          if (typeof observer !== 'function') {
            queueLength = queue.push(observer);
          }
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
  let subsCount = state.subsCount;
  if (!subsCount) return;

  const observers = state.observers!;
  const obsCount = state.obsCount;
  const value = state.value;

  logHook(state, 'NOTIFY_START');

  if (state.onNotifyStart) {
    state.onNotifyStart(value);
  }

  for (let i = 0; subsCount && i < obsCount; i++) {
    const subscriber = observers[i];

    if (typeof subscriber === 'function') {
      subscriber(value);
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
  if (state.isComputing || state.hasCycle) {
    state.hasCycle = true;
    config.logException(new CircularDependencyError());

    return state.value;
  }

  if (state.compute) {
    if (state.freezed) return state.value;

    if (version !== state.version) {
      const value = calcComputed(state, notTrackDeps);

      if (value !== undefined) {
        state.value = value;
        if (calcLevel && state.subsCount) notificationQueue.push(state);
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

      if (tracking.obsCount) {
        activateDependencies(state);

        if (state.observers) {
          state.observers.push(tracking);
        } else {
          state.observers = [tracking];
        }

        ++state.obsCount;
      }
    } else {
      state.depIndex = -1;
    }
  }

  return state.value;
}

function calcComputed<T>(state: SignalState<T>, logException?: boolean) {
  const prevTracking = tracking;
  let value;

  cleanupChildren(state);

  if (!state.dependencies) state.dependencies = [];

  const dependencies = state.dependencies;
  let length = dependencies.length;

  tracking = state;
  tracking.isComputing = true;
  tracking.hasException = false;

  for (let i = 0; i < length; i++) {
    dependencies[i].depIndex = i;
  }

  try {
    value = state.compute!(state.value, calcLevel > 0);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  let newLength = 0;
  length = dependencies.length;

  for (let dep of dependencies) {
    if (dep.depIndex < 0) {
      dependencies[newLength++] = dep;
    } else {
      dep.depIndex = -1;
      dep.observers!.splice(dep.observers!.indexOf(state));
      deactivateDependencies(dep);
    }
  }

  dependencies.splice(newLength);

  tracking.isComputing = false;
  tracking = prevTracking;

  if (state.hasException) {
    logHook(state, 'EXCEPTION');

    if (state.onException) {
      state.onException(state.exception);
    }

    if (logException || state.subsCount || (!state.obsCount && !tracking)) {
      config.logException(state.exception);
    }
  }

  return value;
}

function activateDependencies<T>(state: SignalState<T>) {
  if (state.freezed || state.obsCount) return;

  logHook(state, 'ACTIVATE');

  if (state.onActivate) {
    state.onActivate(state.value);
  }

  if (!state.dependencies) return;

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);

    if (dependency.observers) {
      dependency.observers.push(state);
    } else {
      dependency.observers = [state];
    }

    ++dependency.obsCount;
  }
}

function deactivateDependencies<T>(state: SignalState<T>) {
  if (state.freezed || state.obsCount) return;

  logHook(state, 'DEACTIVATE');

  if (state.$d) state.$d(state.value);

  if (state.onDeactivate) {
    state.onDeactivate(state.value);
  }

  if (!state.dependencies) return;

  for (let dependency of state.dependencies) {
    dependency.observers!.splice(dependency.observers!.indexOf(state));
    --dependency.obsCount;
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
