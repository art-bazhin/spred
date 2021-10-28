import { Atom } from '../atom/atom';
import { Observable } from '../observable/observable';
import { getState, State } from '../state/state';
import { Subscriber } from '../subscriber/subscriber';
import { removeFromArray } from '../utils/removeFromArray';
import { config } from '../config/config';
import { push, pop } from '../stack/stack';
import { nextTick } from '../utils/nextTick';

let currentComputed = pop();

const queue: State<any>[] = [];
let queueLength = 0;

let isCalcActive = false;

export function commit<T>(...pairs: [atom: Atom<T>, value: T][]) {
  for (let [atom, value] of pairs) {
    const state = getState(atom);

    if (!checkDirty(state.value, value)) continue;

    state.value = value;
    state.queueIndex = queue.length;

    queueLength = queue.push(state);
  };

  if (config.async) nextTick(runCalculation);
  else runCalculation();
}

export function subscribe<T>(
  observable: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(observable);
  const value = getStateValue(state);

  if (state.subscribers.indexOf(subscriber) > -1) return;

  activateDependencies(state);

  state.subscribers.push(subscriber);
  state.active++;
  subscriber(value);
}

export function unsubscribe<T>(
  atom: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(atom);

  state.active--;
  removeFromArray(state.subscribers, subscriber);
  deactivateDependencies(state);
}

function resetStateQueueParams(state: State<any>) {
  state.dirtyCount = 0;
  state.queueIndex = -1;
  state.isProcessed = false;
}

function runCalculation() {
  if (isCalcActive || !queueLength) return;
  isCalcActive = true;

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    if (state.isProcessed) continue;

    for (let dependant of state.dependants) {
      dependant.queueIndex = queueLength;
      dependant.dirtyCount++;

      queueLength = queue.push(dependant);
    };

    state.isProcessed = true;
  };

  for (let i = 0; i < queueLength; i++) {
    const state = queue[i];

    if (state.queueIndex !== i) continue;

    if (!state.computedFn) {
      runSubscribers(state);
    } else {
      if (!state.dirtyCount) {
        decreaseDirtyCount(state);
        resetStateQueueParams(state);
        continue;
      }

      const newValue = calcComputed(state);

      if (checkDirty(state.value, newValue)) {
        state.value = newValue;
        runSubscribers(state);
      } else {
        decreaseDirtyCount(state);
      }
    }

    resetStateQueueParams(state);
  };

  queue.length = 0;
  queueLength = 0;
  isCalcActive = false;
}

function decreaseDirtyCount(state: State<any>) {
  for (let dependant of state.dependants) dependant.dirtyCount--;
}

function runSubscribers(state: State<any>) {
  for (let subscriber of state.subscribers) subscriber(state.value);
}

export function getStateValue<T>(state: State<T>): T {
  if (!isCalcActive && queue.length)
    runCalculation();

  if (state.computedFn && !state.active) {
    state.value = calcComputed(state);
  }

  if (currentComputed) {
    const l = currentComputed.dependencies.length;
    let i = currentComputed.dependencies.indexOf(state);
    let v = 1;

    if (i < 0) {
      i = currentComputed.dependencies.push(state) - 1;
      v = 2;
    }

    currentComputed.dc[i] = v;
  }

  return state.value;
}

function checkDirty(prevValue: any, nextValue: any) {
  return !Object.is(prevValue, nextValue);
}

function calcComputed(state: State<any>) {
  let value = state.value;

  currentComputed = push(state);
  currentComputed.dc = [];

  try {
    value = state.computedFn!();
  } catch (e) {
    console.error(e);
  }

  actualize(state);

  currentComputed = pop();

  return value;
}

function activateDependencies(state: State<any>) {
  if (state.active) return;

  for (let dependency of state.dependencies) {
    activateDependencies(dependency);
    dependency.dependants.push(state);
    dependency.active++;
  };
}

function deactivateDependencies(state: State<any>) {
  if (state.active) return;

  for (let dependency of state.dependencies) {
    dependency.active--;
    removeFromArray(dependency.dependants, state);
    deactivateDependencies(dependency);
  };
}

function actualize(state: State<any>) {
  if (!state.active) return;

  state.dependencies.forEach((dependency, i) => {
    const opt = state.dc[i] || 0;

    switch (opt) {
      case 0:
        dependency.active--;
        removeFromArray(dependency.dependants, dependency);
        deactivateDependencies(dependency);
        break;
      case 2:
        activateDependencies(dependency);
        dependency.dependants.push(dependency);
        dependency.active++;
        break;
    }
  });
}
