import { _Atom, Atom } from '../atom/atom';
import { State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { removeFromArray } from '../utils/removeFromArray';
import { push, pop } from '../stack/stack';
import { microtask } from '../utils/microtask';
import { config } from '../config/config';
import { CircularDependencyError } from '../errors/errors';
import { VOID } from '../void/void';

let currentComputed = pop();

let queue: State<any>[] = [];
let queueLength = 0;
let fullQueueLength = 0;

let isCalcActive = false;

export function update<T>(atom: Atom<T>, value?: T) {
  if (arguments.length === 1) {
    commit([[atom]]);
    return;
  }

  commit([[atom, value]]);
}

export function commit(pairs: [atom: Atom<any>, value?: any][]) {
  for (let pair of pairs) {
    const [atom, value] = pair;

    const state = (atom as _Atom<any>)._state;
    const force = pair.length === 1;

    if (force) state.isNotifying = true;
    else state.nextValue = value;

    if (state.computedFn) state.dirtyCount++;

    state.queueIndex = queueLength - fullQueueLength;
    queueLength = queue.push(state);
  }

  if (isCalcActive) return;

  if (config.batchUpdates) microtask(recalc);
  else recalc();
}

export function addSubscriber<T>(
  atom: _Atom<T>,
  subscriber: Subscriber<T>,
  emitOnSubscribe: boolean
) {
  const state = atom._state;

  if (state.subscribers.indexOf(subscriber) > -1) return;

  const value = getStateValue(state);

  activateDependencies(state);

  state.subscribers.push(subscriber);
  state.activeCount++;
  if (emitOnSubscribe) subscriber(value);
}

export function removeSubscriber<T>(atom: _Atom<T>, subscriber: Subscriber<T>) {
  const state = atom._state;

  if (removeFromArray(state.subscribers, subscriber)) {
    state.activeCount--;
  }

  deactivateDependencies(state);
}

function resetStateQueueParams(state: State<any>) {
  state.dirtyCount = 0;
  state.queueIndex = -1;
  state.receivedException = false;
}

function emitUpdateSignal(state: State<any>, value: any) {
  if (!state.signals.update) return;

  state.signals.update[1]({
    value: value,
    prevValue: state.value,
  });
}

export function recalc() {
  if (!queueLength) return;

  isCalcActive = true;
  const notificationQueue: State<any>[] = [];

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
      const value = state.nextValue;
      const shouldUpdate = state.filter(value, state.value);

      if (!state.isNotifying && (!shouldUpdate || value === VOID)) continue;
      if (shouldUpdate) emitUpdateSignal(state, value);

      state.prevValue = state.value;
      state.value = value;
      state.isNotifying = false;

      notificationQueue.push(state);
      resetStateQueueParams(state);
      continue;
    }

    let isCalculated = false;
    let value: any;

    if (!state.dirtyCount && state.receivedException && state.catch) {
      try {
        value = state.catch(state.exception, state.value);

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
      if (state.receivedException && state.signals.exception) {
        state.signals.exception[1](state.exception);
      }

      if (state.dependants.length) {
        decreaseDirtyCount(state);
      } else if (state.receivedException) {
        config.logException(state.exception);
      }

      resetStateQueueParams(state);
      continue;
    }

    if (!isCalculated) value = calcComputed(state);

    if (
      !state.hasException &&
      state.filter(value, state.value) &&
      value !== VOID
    ) {
      emitUpdateSignal(state, value);

      state.prevValue = state.value;
      state.value = value;

      notificationQueue.push(state);
    } else {
      decreaseDirtyCount(state);
    }

    resetStateQueueParams(state);
  }

  queue = queue.slice(fullQueueLength);
  queueLength = queue.length;
  fullQueueLength = queueLength;

  const wrapper = (config as any)._notificationWrapper;

  if (wrapper) {
    wrapper(() => notificationQueue.forEach(runSubscribers));
  } else {
    notificationQueue.forEach(runSubscribers);
  }

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
  if (!state.subscribers.length) return;

  if (state.signals.notifyStart) {
    state.signals.notifyStart[1](state.value);
  }

  for (let subscriber of state.subscribers) {
    subscriber(state.value, state.prevValue);
  }

  if (state.signals.notifyEnd) {
    state.signals.notifyEnd[1](state.value);
  }
}

export function getStateValue<T>(state: State<T>): T {
  if (state.isComputing || state.hasCycle) {
    state.hasCycle = true;
    config.logException(new CircularDependencyError());

    return state.value;
  }

  if (!isCalcActive) recalc();

  if (state.computedFn && !state.activeCount && !state.isCached()) {
    const value = calcComputed(state);

    if (state.filter(value, state.value) && value !== (VOID as any)) {
      state.prevValue = state.value;
      state.value = value;
    }
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
    if (state.signals.exception) {
      state.signals.exception[1](state.exception);
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

  if (state.signals.activate) {
    state.signals.activate[1](state.value);
  }

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);
    dependency.dependants.push(state);
    dependency.activeCount++;
  }
}

function deactivateDependencies<T>(state: State<T>) {
  if (state.activeCount) return;

  if (state.signals.deactivate) {
    state.signals.deactivate[1](state.value);
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
