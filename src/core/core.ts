import { Atom } from '../atom/atom';
import { Observable } from '../observable/observable';
import { getState, State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { removeFromArray } from '../utils/removeFromArray';
import { push, pop } from '../stack/stack';
import { microtask } from '../utils/microtask';
import { config } from '../config/config';

let currentComputed = pop();

let queue: State<any>[] = [];
let queueLength = 0;
let fullQueueLength = 0;

let isCalcActive = false;

export function update<T>(atom: Atom<T>, value: T) {
  const state = getState(atom);

  if (!config.checkDirty(value, state.value)) return;

  state.prevValue = state.value;
  state.value = value;
  state.queueIndex = queueLength - fullQueueLength;
  queueLength = queue.push(state);

  if (isCalcActive) return;

  if (config.async) microtask(recalc);
  else recalc();
}

export function subscribe<T>(
  observable: Observable<T>,
  subscriber: Subscriber<T>,
  emitOnSubscribe: boolean
) {
  const state = getState(observable);
  const value = getStateValue(state);

  if (state.subscribers.indexOf(subscriber) > -1) return;

  activateDependencies(state);

  state.subscribers.push(subscriber);
  state.active++;
  if (emitOnSubscribe) subscriber(value);
}

export function unsubscribe<T>(atom: Observable<T>, subscriber: Subscriber<T>) {
  const state = getState(atom);

  state.active--;
  removeFromArray(state.subscribers, subscriber);
  deactivateDependencies(state);
}

function resetStateQueueParams(state: State<any>) {
  state.errorChanged = false;
  state.dirtyCount = 0;
  state.queueIndex = -1;
  state.isProcessed = false;
}

export function recalc() {
  if (!queueLength) return;

  isCalcActive = true;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    if (state.isProcessed) continue;

    for (let dependant of state.dependants) {
      dependant.queueIndex = queueLength;
      dependant.dirtyCount++;

      queueLength = queue.push(dependant);
    }

    state.isProcessed = true;
  }

  fullQueueLength = queueLength;

  for (let i = 0; i < fullQueueLength; i++) {
    const state = queue[i];

    if (state.queueIndex !== i) continue;

    if (state.errorChanged) spreadError(state);

    if (!state.computedFn || state.incomingError) {
      runSubscribers(state);
      resetStateQueueParams(state);
      continue;
    }

    if (!state.dirtyCount) {
      decreaseDirtyCount(state);
      resetStateQueueParams(state);
      continue;
    }

    const newValue = calcComputed(state);

    if (
      config.checkDirty(newValue, state.value) ||
      state.error ||
      state.errorChanged
    ) {
      if (!state.error) {
        state.prevValue = state.value;
        state.value = newValue;
      }

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

function spreadError(state: State<any>) {
  for (let dependant of state.dependants) {
    dependant.incomingError = state.error || state.incomingError;
    dependant.errorChanged = true;
  }
}

function decreaseDirtyCount(state: State<any>) {
  for (let dependant of state.dependants) dependant.dirtyCount--;
}

function runSubscribers<T>(state: State<T>) {
  for (let subscriber of state.subscribers) {
    const err = state.error || state.incomingError;

    if (err) subscriber(state.value, state.prevValue, err);
    else subscriber(state.value, state.prevValue);
  }
}

export function getStateValue<T>(state: State<T>): T {
  if (!isCalcActive) recalc();

  if (state.computedFn && !state.active && !state.incomingError) {
    state.prevValue = state.value;
    state.value = calcComputed(state);
  }

  if (currentComputed) {
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
  let value = state.value;

  const hadError = state.error;

  currentComputed = push(state);
  currentComputed.dependencyStatuses = [];
  currentComputed.dependencyStatusesSum = 0;

  try {
    value = state.computedFn!(value);

    if (hadError) {
      state.error = undefined;
      state.errorChanged = true;
      spreadError(state);
    }
  } catch (e: any) {
    config.logError(e);

    state.error = e;
    state.errorChanged = true;

    spreadError(state);
  }

  if (
    !state.error &&
    state.active &&
    state.dependencyStatusesSum !== state.dependencies.length
  ) {
    actualizeDependencies(state);
  }

  currentComputed = pop();

  if (!state.active && currentComputed) {
    currentComputed.incomingError = state.error || state.incomingError;
  }

  return value;
}

function activateDependencies(state: State<any>) {
  if (state.active) return;

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);
    dependency.dependants.push(state);
    dependency.active++;
  }
}

function deactivateDependencies(state: State<any>) {
  if (state.active) return;

  for (let dependency of state.dependencies) {
    dependency.active--;
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
        dependency.active--;
        removeFromArray(dependency.dependants, state);
        deactivateDependencies(dependency);
        break;
      case -1:
        activateDependencies(dependency);
        dependency.dependants.push(state);
        dependency.active++;
        break;
    }
  });

  state.dependencies = state.dependencies.filter(
    (_, i) => state.dependencyStatuses[i]
  );
}
