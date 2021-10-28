import { Atom } from './atom';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';
import { nextTick, removeFromArray } from './utils';
import { config } from './config';
import { push, pop } from './stack';

export const STATE_KEY = '__spredState__';

let currentComputed = pop();

const calcQueue: State<any>[] = [];

let isCalcActive = false;

function getState<T>(observable: Observable<T>): State<T> {
  return (observable as any)[STATE_KEY];
}

export function commit<T>(...pairs: [atom: Atom<T>, value: T][]) {
  for (let [atom, value] of pairs) {
    const state = getState(atom);

    if (!checkDirty(state.value, value)) continue;

    state.value = value;
    state.queueIndex = calcQueue.length;

    calcQueue.push(state);
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
  if (isCalcActive || !calcQueue.length) return;
  isCalcActive = true;

  for (let i = 0; i < calcQueue.length; i++) {
    const state = calcQueue[i];

    if (state.isProcessed) continue;

    for (let dependant of state.dependants) {
      dependant.queueIndex = calcQueue.length;
      dependant.dirtyCount++;

      calcQueue.push(dependant);
    };

    state.isProcessed = true;
  };

  const l = calcQueue.length;

  for (let i = 0; i < l; i++) {
    const state = calcQueue[i];

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

  calcQueue.length = 0;
  isCalcActive = false;
}

function decreaseDirtyCount(state: State<any>) {
  for (let dependant of state.dependants) dependant.dirtyCount--;
}

function runSubscribers(state: State<any>) {
  for (let subscriber of state.subscribers) subscriber(state.value);
}

export function getStateValue<T>(state: State<T>): T {
  if (!isCalcActive && calcQueue.length)
    runCalculation();

  if (state.computedFn && !state.active) {
    state.value = calcComputed(state);
  }

  if (currentComputed && currentComputed.dependencies.indexOf(state) < 0) {
    removeFromArray(currentComputed.oldDependencies, state);
    currentComputed.dependencies.push(state);
  }

  return state.value;
}

function checkDirty(prevValue: any, nextValue: any) {
  return !Object.is(prevValue, nextValue);
}

function calcComputed(state: State<any>) {
  let value = state.value;

  currentComputed = push(state);

  state.oldDependencies = state.dependencies;
  state.dependencies = [];

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

  for (let dependency of state.dependencies) {
    const dependants = dependency.dependants;

    if (dependants.indexOf(state) > -1) continue;
    activateDependencies(dependency);
    dependants.push(state);
    dependency.active++;
  };

  for (let dependency of state.oldDependencies) {
    dependency.active--;
    removeFromArray(dependency.dependants, state);
    deactivateDependencies(dependency);
  };
}
