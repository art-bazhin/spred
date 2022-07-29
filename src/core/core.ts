import { _Signal } from '../signal/signal';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { push, pop, storeStackValues } from '../stack/stack';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';

let currentComputed: State<any> | undefined;
let batchLevel = 0;
let calcLevel = 0;

let queue: State<any>[] = [];
let queueLength = 0;
let fullQueueLength = 0;

let checked = false;

export function check(fn: () => any) {
  checked = false;
  isolate(fn);
  return checked;
}

export function isolate(fn: () => any) {
  const restore = storeStackValues();

  currentComputed = push();
  fn();
  currentComputed = restore();
}

export function batch(fn: (...args: any) => any) {
  batchLevel++;
  fn();
  batchLevel--;

  recalc();
}

export function update<T>(state: State<T>, value?: T) {
  const force = arguments.length === 1;

  if (force) {
    state.isNotifying = true;
    state.nextValue = state.value;
  } else {
    state.nextValue = value;
  }

  if (state.computedFn) state.dirtyCount++;

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
  if (exec) subscriber(value, true);
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

    if (!state.computedFn) {
      const value = state.nextValue;
      const shouldUpdate = value !== undefined;

      if (!state.isNotifying && !shouldUpdate) continue;

      if (shouldUpdate) {
        emitUpdateLifecycle(state, value);
        state.value = value;
      }

      notificationQueue.push(state);
      resetStateQueueParams(state);
      state.isNotifying = false;

      continue;
    }

    if (state.hasException) {
      state.dirtyCount = 0;

      if (state.onException) {
        state.onException.forEach((fn) => fn(state.exception));
      }

      if (!(state.observers.size - state.subsCount)) {
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

  if (wrapper) {
    wrapper(() => notificationQueue.forEach(runSubscribers));
  } else {
    notificationQueue.forEach(runSubscribers);
  }
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

  if (state.computedFn && !state.observers.size && !state.isCached.status) {
    const value = calcComputed(state, notTrackDeps);

    if (value !== undefined) {
      state.value = value;
    }
  }

  if (currentComputed && !notTrackDeps) {
    if (
      state.hasException &&
      !currentComputed.hasException &&
      !currentComputed.isCatcher
    ) {
      currentComputed.exception = state.exception;
      currentComputed.hasException = true;
    }

    const isNewDep = !currentComputed.dependencies.delete(state);
    currentComputed.dependencies.add(state);
    --currentComputed.oldDepsCount;

    if (isNewDep) {
      if (currentComputed.observers.size) {
        activateDependencies(state);
        state.observers.add(currentComputed);
      }
    }
  }

  return state.value;
}

function calcComputed<T>(state: State<T>, logException?: boolean) {
  const prevComputed = currentComputed;
  let value;

  currentComputed = push(state);

  try {
    value = state.computedFn!(state.value);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  let i = state.oldDepsCount;

  for (let dependency of state.dependencies) {
    if (i <= 0) break;
    state.dependencies.delete(dependency);
    dependency.observers.delete(state);
    deactivateDependencies(dependency);
    --i;
  }

  currentComputed = pop(prevComputed);

  if (state.hasException) {
    if (state.onException) {
      state.onException.forEach((fn) => fn(state.exception));
    }

    if (
      logException ||
      (!state.observers.size && !currentComputed) ||
      (state.observers.size && !(state.observers.size - state.subsCount))
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

  for (let dependency of state.dependencies) {
    dependency.observers.delete(state);
    deactivateDependencies(dependency);
  }
}
