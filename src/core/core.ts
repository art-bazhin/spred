import { _Observable } from '../observable/observable';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { removeFromArray } from '../utils/removeFromArray';
import { push, pop } from '../stack/stack';
import { microtask } from '../utils/microtask';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { _Signal } from '../signal/signal';

let currentComputed = pop();

let queue: State<any>[] = [];
let queueLength = 0;
let fullQueueLength = 0;

let isCalcActive = false;

export function update<T>(atom: _Observable<T>, value: T) {
  const state = atom._state;

  if (!config.checkDirty(value, state.value)) return;

  state.prevValue = state.value;
  state.value = value;
  state.queueIndex = queueLength - fullQueueLength;
  queueLength = queue.push(state);

  if (isCalcActive) return;

  if (config.async) microtask(recalc);
  else recalc();
}

export function addSubscriber<T>(
  observable: _Observable<T>,
  subscriber: Subscriber<T>,
  emitOnSubscribe: boolean
) {
  const state = observable._state;

  if (state.subscribers.indexOf(subscriber) > -1) return;

  const value = getStateValue(state);

  activateDependencies(state);

  state.subscribers.push(subscriber);
  state.activeCount++;
  if (emitOnSubscribe) subscriber(value);
}

export function removeSubscriber<T>(
  observable: _Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = observable._state;

  state.activeCount--;
  removeFromArray(state.subscribers, subscriber);
  deactivateDependencies(state);
}

function resetStateQueueParams(state: State<any>) {
  state.dirtyCount = 0;
  state.queueIndex = -1;
  state.receivedException = false;
}

export function recalc() {
  if (!queueLength) return;

  isCalcActive = true;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    if (state.queueIndex !== i) continue;

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
      runSubscribers(state);
      resetStateQueueParams(state);
      continue;
    }

    let isCalculated = false;
    let value: any;

    if (!state.dirtyCount && state.receivedException && state.handleException) {
      try {
        value = state.handleException(state.exception, state.value);

        state.hasException = false;
        state.receivedException = false;
        state.exception = undefined;

        state.dirtyCount = 1;
        isCalculated = true;
      } catch (e) {
        state.exception = e;
      }
    }

    if (!state.dirtyCount) {
      if (state.receivedException) {
        (state.owner.exception as _Signal<any>)._emit(state.exception);
      }

      if (state.dependants.length) {
        decreaseDirtyCount(state);
      } else if (state.receivedException) {
        config.logError(state.exception);
      }

      resetStateQueueParams(state);
      continue;
    }

    if (!isCalculated) value = calcComputed(state);

    if (!state.hasException && config.checkDirty(value, state.value)) {
      state.prevValue = state.value;
      state.value = value;

      runSubscribers(state);
    } else {
      decreaseDirtyCount(state);
    }

    resetStateQueueParams(state);
  }

  queue = queue.slice(fullQueueLength);
  queueLength = queue.length;
  fullQueueLength = queueLength;

  recalc();

  isCalcActive = false;
}

function decreaseDirtyCount(state: State<any>) {
  for (let dependant of state.dependants) {
    dependant.dirtyCount--;

    if (state.hasException && !dependant.receivedException) {
      dependant.hasException = true;
      dependant.receivedException = true;
      dependant.exception = state.exception;
    }
  }
}

function runSubscribers<T>(state: State<T>) {
  for (let subscriber of state.subscribers) {
    subscriber(state.value, state.prevValue);
  }
}

export function getStateValue<T>(state: State<T>): T {
  if (state.isComputing || state.hasCycle) {
    state.hasCycle = true;
    config.logError(new CircularDependencyError());

    return state.value;
  }

  if (!isCalcActive) recalc();

  if (state.computedFn && !state.activeCount && !state.isCached()) {
    state.prevValue = state.value;
    state.value = calcComputed(state);
  }

  if (currentComputed) {
    if (state.hasException && !currentComputed.hasException) {
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

  let value = state.value;

  currentComputed = push(state);
  currentComputed.dependencyStatuses = [];
  currentComputed.dependencyStatusesSum = 0;

  try {
    value = state.computedFn!(value);
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

  if (!state.hasException) return value;

  if (state.handleException) {
    try {
      value = state.handleException(state.exception, state.value);

      state.hasException = false;
      state.exception = undefined;
    } catch (e) {
      state.exception = e;
    }
  }

  if (state.hasException) {
    (state.owner.exception as _Signal<any>)._emit(state.exception);

    if (
      (!state.activeCount && !currentComputed) ||
      (state.activeCount && !state.dependants.length)
    ) {
      config.logError(state.exception);
    }
  }

  return value;
}

function activateDependencies(state: State<any>) {
  if (state.activeCount) return;

  (state.owner.activated as _Signal<any>)._emit();

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);
    dependency.dependants.push(state);
    dependency.activeCount++;
  }
}

function deactivateDependencies(state: State<any>) {
  if (state.activeCount) return;

  (state.owner.deactivated as _Signal<any>)._emit();

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
