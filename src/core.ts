import { Subject } from './subject';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';
import { nextTick, removeFromArray } from './utils';
import { config } from './config';

export const STATE_KEY = '__spredState__';

let currentComputed: State<any> | undefined;
const currentComputedList: State<any>[] = [];

let currentComputedCounters: number[] = [];
let currentComputedIndex = -1;

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

  if (state.subscribers.find(s => s === subscriber)) return;

  toggleDependencies(state, true);

  state.subscribers.push(subscriber);
  subscriber(value);
}

export function unsubscribe<T>(
  subject: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(subject);

  removeFromArray(state.subscribers, subscriber);
  toggleDependencies(state, false);
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
    const deps = currentComputed.dependencies;
    const i = ++currentComputedCounters[currentComputedIndex];

    removeFromArray(currentComputed.obsoleteDependencies, state);

    deps[i] = state;
  }

  return state.value;
}

function checkDirty(prevValue: any, nextValue: any) {
  return !Object.is(prevValue, nextValue);
}

function calcComputed(state: State<any>) {
  let value = state.value;

  // state.dependencies.forEach(dependency => {
  //   removeFromArray(dependency.dependants, state);
  //   toggleDependencies(dependency, false);
  // });

  //state.dependencies.length = 0;
  
  if (currentComputed) currentComputedList.push(currentComputed);
  currentComputed = state;
  state.obsoleteDependencies = [...state.dependencies];
  currentComputedIndex++;
  currentComputedCounters[currentComputedIndex] = -1;

  try {
    value = state.computedFn!();
  } catch (e) {
    console.error(e);
  }

  state.dependencies.length = currentComputedCounters[currentComputedIndex] + 1;
  actualize(state);

  currentComputed = currentComputedList.pop();
  currentComputedIndex--;

  if (currentComputedIndex < 0) {
    currentComputedCounters = [];
  }

  return value;
}

function toggleDependencies(state: State<any>, activate: boolean) {
  if (isActive(state)) return;

  state.dependencies.forEach((dependency) => {
    if (activate) {
      toggleDependencies(dependency, activate);
      dependency.dependants.push(state);
    } else {
      removeFromArray(dependency.dependants, state);
      toggleDependencies(dependency, activate);
    }
  });
}

function actualize(state: State<any>) {
  if (!isActive(state)) return;

  state.dependencies.forEach(dependency => {
    const dependants = dependency.dependants;

    if (dependants.includes(state)) return;
    toggleDependencies(dependency, true);
    dependants.push(state);
  });

  state.obsoleteDependencies.forEach(dependency => {
    removeFromArray(dependency.dependants, state);
    toggleDependencies(dependency, false);
  });
}

function isActive(state: State<any>) {
  return state.dependants.length || state.subscribers.length;
}
