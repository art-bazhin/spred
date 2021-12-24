import { _Signal, Signal } from '../signal-type/signal-type';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { removeFromArray } from '../utils/removeFromArray';
import { push, pop } from '../stack/stack';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';

let currentComputed = pop();
let batchLevel = 0;
let calcLevel = 0;

let queue: State<any>[] = [];
let queueLength = 0;
let fullQueueLength = 0;

export function batch(fn: (...args: any) => any) {
  batchLevel++;
  fn();
  batchLevel--;

  if (calcLevel || batchLevel) return;

  recalc();
}

export function update<T>(signal: Signal<T>, value?: T) {
  const state = (signal as _Signal<any>)._state;
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

  if (calcLevel || batchLevel) return;

  recalc();
}

export function addSubscriber<T>(
  signal: _Signal<T>,
  subscriber: Subscriber<T>,
  exec: boolean
) {
  const state = signal._state;

  if (state.subscribers.indexOf(subscriber) > -1) return;

  const value = getStateValue(state);

  activateDependencies(state);

  state.subscribers.push(subscriber);
  state.activeCount++;
  if (exec) subscriber(value, state.prevValue, true);
}

export function removeSubscriber<T>(
  signal: _Signal<T>,
  subscriber: Subscriber<T>
) {
  const state = signal._state;

  if (removeFromArray(state.subscribers, subscriber)) {
    state.activeCount--;
  }

  deactivateDependencies(state);
}

function resetStateQueueParams(state: State<any>) {
  state.dirtyCount = 0;
  state.queueIndex = -1;
}

function emitUpdateLifecycle(state: State<any>, value: any) {
  if (!state.lifecycle.update) return;

  state.lifecycle.update.forEach((fn) =>
    fn({
      value: value,
      prevValue: state.value,
    })
  );
}

/**
 * Immediately calculates the updated values of the signals and notifies their subscribers.
 */
export function recalc(shouldNotify = true) {
  if (!queueLength) return;

  const notificationQueue: State<any>[] = [];

  calcLevel++;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    if (state.queueIndex !== i) continue;

    state.hasException = false;

    for (let dependant of state.dependants) {
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
        state.prevValue = state.value;
        state.value = value;
      }

      notificationQueue.push(state);
      resetStateQueueParams(state);
      state.isNotifying = false;

      continue;
    }

    if (state.hasException) {
      state.dirtyCount = 0;

      if (state.lifecycle.exception) {
        state.lifecycle.exception.forEach((fn) => fn(state.exception));
      }

      if (!state.dependants.length) {
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

      state.prevValue = state.value;
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

  recalc(false);

  if (shouldNotify) notify(notificationQueue);
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
  for (let dependant of state.dependants) {
    if (state.hasException && dependant.isCatcher) continue;

    dependant.dirtyCount--;

    if (state.hasException && !dependant.hasException) {
      dependant.hasException = true;
      dependant.exception = state.exception;
    }
  }
}

function runSubscribers<T>(state: State<T>) {
  if (!state.subscribers.length) return;

  if (state.lifecycle.notifyStart) {
    state.lifecycle.notifyStart.forEach((fn) => fn(state.value));
  }

  for (let subscriber of state.subscribers) {
    subscriber(state.value, state.prevValue);
  }

  if (state.lifecycle.notifyEnd) {
    state.lifecycle.notifyEnd.forEach((fn) => fn(state.value));
  }
}

export function getStateValue<T>(state: State<T>): T {
  if (state.isComputing || state.hasCycle) {
    state.hasCycle = true;
    config.logException(new CircularDependencyError());

    return state.value;
  }

  if (state.computedFn && !state.activeCount && !state.isCached()) {
    const value = calcComputed(state);

    if (value !== undefined) {
      state.prevValue = state.value;
      state.value = value;
    }
  }

  if (currentComputed) {
    if (
      state.hasException &&
      !currentComputed.hasException &&
      !currentComputed.isCatcher
    ) {
      currentComputed.exception = state.exception;
      currentComputed.hasException = true;
    }

    let i = currentComputed.dependencies.indexOf(state);
    let status = 1;

    if (i < 0) {
      i = currentComputed.dependencies.push(state) - 1;
      status = -1;
    }

    currentComputed.dependencyStatuses[i] = status;
    currentComputed.dependencyStatusesSum += status;
  }

  return state.value;
}

function calcComputed<T>(state: State<T>) {
  state.hasException = false;

  let value = undefined;

  currentComputed = push(state);
  currentComputed.dependencyStatuses = [];
  currentComputed.dependencyStatusesSum = 0;

  try {
    value = state.computedFn!(state.value);
  } catch (e: any) {
    state.exception = e;
    state.hasException = true;
  }

  if (
    state.activeCount &&
    state.dependencyStatusesSum !== state.dependencies.length
  ) {
    actualizeDependencies(state);
  }

  currentComputed = pop();

  if (state.hasException) {
    value = undefined;

    if (state.lifecycle.exception) {
      state.lifecycle.exception.forEach((fn) => fn(state.exception));
    }

    if (
      (!state.activeCount && !currentComputed) ||
      (state.activeCount && !state.dependants.length)
    ) {
      config.logException(state.exception);
    }
  }

  return value;
}

function activateDependencies<T>(state: State<T>) {
  if (state.activeCount) return;

  if (state.lifecycle.activate) {
    state.lifecycle.activate.forEach((fn) => fn(state.value));
  }

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);
    dependency.dependants.push(state);
    dependency.activeCount++;
  }
}

function deactivateDependencies<T>(state: State<T>) {
  if (state.activeCount) return;

  if (state.lifecycle.deactivate) {
    state.lifecycle.deactivate.forEach((fn) => fn(state.value));
  }

  for (let dependency of state.dependencies) {
    dependency.activeCount--;
    removeFromArray(dependency.dependants, state);
    deactivateDependencies(dependency);
  }
}

function actualizeDependencies(state: State<any>) {
  state.dependencies.forEach((dependency, i) => {
    const opt = state.dependencyStatuses[i] || 0;

    switch (opt) {
      case 1:
        return;
      case 0:
        dependency.activeCount--;
        removeFromArray(dependency.dependants, state);
        deactivateDependencies(dependency);
        break;
      case -1:
        activateDependencies(dependency);
        dependency.dependants.push(state);
        dependency.activeCount++;
        break;
    }
  });

  state.dependencies = state.dependencies.filter(
    (_, i) => state.dependencyStatuses[i]
  );
}
