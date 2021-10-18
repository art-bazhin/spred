import { Subject } from './subject';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';
import { nextTick, removeFromArray } from './utils';
import { config } from './config';
import { push, pop } from './stack';

export const STATE_KEY = '__spredState__';

let currentComputed = pop();

let calcQueue: State<any>[] = [];

let isCalcActive = false;

function getState<T>(key: Observable<T>): State<T> {
  return (key as any)[STATE_KEY];
}

export function commit<T>(...pairs: [subject: Subject<T>, value: T][]) {
  pairs.forEach(([subject, value], i) => {
    const state = getState(subject);

    if (!checkDirty(state.value, value)) return;

    state.value = value;
    state.queueIndex = calcQueue.length;

    calcQueue.push(state);
  });

  if (config.async) nextTick(runCalculation);
  else runCalculation();
}

export function subscribe<T>(
  observable: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(observable);
  const value = getStateValue(state);

  if (state.subscribers.includes(subscriber)) return;

  activateDependencies(state);

  state.subscribers.push(subscriber);
  subscriber(value);
}

export function unsubscribe<T>(
  subject: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(subject);

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

    state.dependants.forEach((dependant) => {
      dependant.queueIndex = calcQueue.length;
      dependant.dirtyCount++;

      calcQueue.push(dependant);
    });

    state.isProcessed = true;
  };

  calcQueue.forEach((state, i) => {
    if (state.queueIndex !== i) return;

    if (!state.computedFn) {
      runSubscribers(state);
    } else {
      if (!state.dirtyCount) {
        decreaseDirtyCount(state);
        resetStateQueueParams(state);
        return;
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
  });

  calcQueue = [];
  isCalcActive = false;
}

function decreaseDirtyCount(state: State<any>) {
  state.dependants.forEach((dependant) => dependant.dirtyCount--);
}

function runSubscribers(state: State<any>) {
  state.subscribers.forEach((subscriber) => subscriber(state.value));
}

export function getStateValue<T>(state: State<T>): T {
  if (!isCalcActive && calcQueue.length)
    runCalculation();

  if (state.computedFn && !isActive(state)) {
    state.value = calcComputed(state);
  }

  if (currentComputed) {
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
  if (isActive(state)) return;

  state.dependencies.forEach((dependency) => {
    activateDependencies(dependency);
    dependency.dependants.push(state);
  });
}

function deactivateDependencies(state: State<any>) {
  if (isActive(state)) return;

  state.dependencies.forEach((dependency) => {
    removeFromArray(dependency.dependants, state);
    deactivateDependencies(dependency);
  });
}

function actualize(state: State<any>) {
  if (!isActive(state)) return;

  state.dependencies.forEach(dependency => {
    const dependants = dependency.dependants;

    if (dependants.includes(state)) return;
    activateDependencies(dependency);
    dependants.push(state);
  });

  state.oldDependencies.forEach(dependency => {
    removeFromArray(dependency.dependants, state);
    deactivateDependencies(dependency);
  });
}

function isActive(state: State<any>) {
  return state.dependants.length || state.subscribers.length;
}
