import { _Signal } from '../signal/signal';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { FALSE_STATUS } from '../utils/constants';

export let tracking: State<any> | null = null;
export let scope: State<any> | null = null;

let batchLevel = 0;
let calcLevel = 0;

let queue: State<any>[] = [];
let queueLength = 0;
let fullQueueLength = 0;

let checked = false;

let depth = 0;
let cacheStatus = { status: true };

export function check(fn: () => any) {
  checked = false;
  isolate(fn);
  return checked;
}

export function isolate(fn: () => any): void;
export function isolate<A extends unknown[]>(
  fn: (...args: A) => any,
  args: A
): void;
export function isolate(fn: any, args?: any) {
  const prevCacheStatus = cacheStatus;
  const prevDepth = depth;
  const prevTracking = tracking;
  const prevScope = scope;

  if (tracking) scope = tracking;
  tracking = null;
  depth = 0;

  if (args) fn(...args);
  else fn();

  cacheStatus = prevCacheStatus;
  depth = prevDepth;
  tracking = prevTracking;
  scope = prevScope;
}

export function collect(fn: () => any) {
  const prevCacheStatus = cacheStatus;
  const prevDepth = depth;
  const prevTracking = tracking;
  const prevScope = scope;
  const fakeState = {} as any as State<any>;

  scope = fakeState;
  tracking = null;
  depth = 0;

  fn();

  cacheStatus = prevCacheStatus;
  depth = prevDepth;
  tracking = prevTracking;
  scope = prevScope;

  return () => clearChildren(fakeState);
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

export function update<T>(state: State<T>, value?: T) {
  if (arguments.length === 2) state.nextValue = value;
  else if (state.compute) state.dirtyCount++;

  state.queueIndex = queueLength - fullQueueLength;
  queueLength = queue.push(state);

  recalc();
}

export function addSubscriber<T>(
  signal: _Signal<T>,
  subscriber: Subscriber<T>,
  exec: boolean
) {
  const state = signal._state;

  if (state.observers.has(subscriber)) return;
  const value = getStateValue(state, true);

  activateDependencies(state);

  state.observers.add(subscriber);
  state.subsCount++;

  if (exec) {
    isolate(() => subscriber(value, true));
  }
}

export function removeSubscriber<T>(
  signal: _Signal<T>,
  subscriber: Subscriber<T>
) {
  const state = signal._state;

  if (state.observers.delete(subscriber)) {
    state.subsCount--;
    deactivateDependencies(state);
  }
}

function resetStateQueueParams(state: State<any>) {
  state.dirtyCount = 0;
  state.queueIndex = -1;
}

function emitUpdateLifecycle(state: State<any>, value: any) {
  if (!state.onUpdate) return;

  state.onUpdate.forEach((fn) =>
    fn({
      value: value,
      prevValue: state.value,
    })
  );
}

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc() {
  if (!queueLength || calcLevel || batchLevel) return;

  const notificationQueue: State<any>[] = [];

  calcLevel++;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    if (state.queueIndex !== i) continue;

    state.hasException = false;

    for (let dependant of state.observers) {
      if (typeof dependant === 'function') continue;
      dependant.queueIndex = queueLength;
      dependant.dirtyCount++;

      queueLength = queue.push(dependant);
    }
  }

  fullQueueLength = queueLength;

  for (let i = 0; i < fullQueueLength; i++) {
    const state = queue[i];

    if (state.queueIndex !== i) continue;

    if (!state.compute) {
      const value = state.nextValue;
      const shouldUpdate = value !== undefined;

      if (shouldUpdate) {
        clearChildren(state);
        emitUpdateLifecycle(state, value);
        state.value = value;
      }

      notificationQueue.push(state);
      resetStateQueueParams(state);

      continue;
    }

    if (state.hasException) {
      state.dirtyCount = 0;

      if (state.onException) {
        state.onException.forEach((fn) => fn(state.exception));
      }

      if (state.subsCount) {
        config.logException(state.exception);
      }
    }

    if (!state.dirtyCount) {
      decreaseDirtyCount(state);
      resetStateQueueParams(state);
      continue;
    }

    const value = calcComputed(state);

    if (value !== undefined) {
      emitUpdateLifecycle(state, value);
      state.value = value;
      notificationQueue.push(state);
    } else {
      decreaseDirtyCount(state);
    }

    resetStateQueueParams(state);
  }

  calcLevel--;

  queue = queue.slice(fullQueueLength);
  queueLength = queue.length;
  fullQueueLength = queueLength;

  notify(notificationQueue);
  recalc();
}

function notify(notificationQueue: State<any>[]) {
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

  batchLevel--;
}

function decreaseDirtyCount(state: State<any>) {
  for (let dependant of state.observers) {
    if (typeof dependant === 'function') continue;
    if (state.hasException && dependant.isCatcher) continue;

    dependant.dirtyCount--;

    if (state.hasException && !dependant.hasException) {
      dependant.hasException = true;
      dependant.exception = state.exception;
    }
  }
}

function runSubscribers<T>(state: State<T>) {
  let i = state.subsCount;
  if (!i) return;

  if (state.onNotifyStart) {
    state.onNotifyStart.forEach((fn) => fn(state.value));
  }

  for (let subscriber of state.observers) {
    if (!i) break;
    if (typeof subscriber !== 'function') continue;
    subscriber(state.value);
    --i;
  }

  if (state.onNotifyEnd) {
    state.onNotifyEnd.forEach((fn) => fn(state.value));
  }
}

export function getStateValue<T>(state: State<T>, notTrackDeps?: boolean): T {
  if (!notTrackDeps) checked = true;

  if (state.isComputing || state.hasCycle) {
    state.hasCycle = true;
    config.logException(new CircularDependencyError());

    return state.value;
  }

  if (state.compute && !state.observers.size && !state.isCached.status) {
    const value = calcComputed(state, notTrackDeps);

    if (value !== undefined) {
      state.value = value;
    }
  }

  if (tracking && !notTrackDeps) {
    if (state.hasException && !tracking.hasException && !tracking.isCatcher) {
      tracking.exception = state.exception;
      tracking.hasException = true;
    }

    const isNewDep = !tracking.dependencies!.delete(state);
    tracking.dependencies!.add(state);
    --tracking.oldDepsCount;

    if (isNewDep) {
      if (tracking.observers.size) {
        activateDependencies(state);
        state.observers.add(tracking);
      }
    }
  }

  return state.value;
}

function calcComputed<T>(state: State<T>, logException?: boolean) {
  const prevTracking = tracking;
  let value;

  push(state);

  try {
    value = state.compute!(state.value);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  let i = state.oldDepsCount;

  for (let dependency of state.dependencies!) {
    if (i <= 0) break;
    state.dependencies!.delete(dependency);
    dependency.observers.delete(state);
    deactivateDependencies(dependency);
    --i;
  }

  pop(prevTracking);

  if (state.hasException) {
    if (state.onException) {
      state.onException.forEach((fn) => fn(state.exception));
    }

    if (
      logException ||
      state.subsCount ||
      (!state.observers.size && !tracking)
    ) {
      config.logException(state.exception);
    }
  }

  return value;
}

function activateDependencies<T>(state: State<T>) {
  if (state.observers.size) return;

  if (state.onActivate) {
    state.onActivate.forEach((fn) => fn(state.value));
  }

  if (!state.dependencies) return;

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);
    dependency.observers.add(state);
  }
}

function deactivateDependencies<T>(state: State<T>) {
  if (state.observers.size) return;

  if (state.onDeactivate) {
    state.onDeactivate.forEach((fn) => fn(state.value));
  }

  if (!state.dependencies) return;

  for (let dependency of state.dependencies) {
    dependency.observers.delete(state);
    deactivateDependencies(dependency);
  }
}

function push(state: State<any>) {
  clearChildren(state);

  if (!state.observers.size) {
    if (!depth) cacheStatus = { status: true };
    ++depth;
  }

  tracking = state;
  tracking.isComputing = true;
  tracking.isCached = FALSE_STATUS;
  tracking.oldDepsCount = state.dependencies!.size;
  tracking.hasException = false;

  return tracking;
}

function pop(state: State<any> | null) {
  tracking!.isComputing = false;
  tracking!.isCached = cacheStatus;

  if (depth) --depth;
  if (!depth) cacheStatus.status = false;

  tracking = state;

  return tracking;
}

function clearChildren(state: State<any>) {
  if (state.children && state.children.length) {
    for (let child of state.children) {
      if (typeof child === 'function') child();
      else clearChildren(child);
    }

    state.children = [];
  }

  if (state.lcUnsubs && state.lcUnsubs.length) {
    for (let unsub of state.lcUnsubs) unsub();
    state.lcUnsubs = [];
  }
}
