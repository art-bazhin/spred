import { Subject } from './subject';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';
import { nextTick, removeFromArray } from './utils';
import { config } from './config';

export const STATE_KEY = '__spredState__';

let currentComputed: State<any> | undefined;
const currentComputedList: State<any>[] = [];
let calcQueue: State<any>[] = [];

let isCalcActive = false;

const promise = Promise.resolve();

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

  if (currentComputed) {
    const deps = currentComputed.dependencies;

    if (!deps.find(el => el === state)) {
      deps.push(state);

      if (
        currentComputed.dependants.length ||
        currentComputed.subscribers.length
      ) {
        state.dependants.push(currentComputed);
      }
    }
  }

  if (state.computedFn) {
    if (
      state.dependants.length ||
      state.subscribers.length
    )
      return state.value;

    state.value = calcComputed(state);
  }

  return state.value;
}

function checkDirty(prevValue: any, nextValue: any) {
  return !Object.is(prevValue, nextValue);
}

function calcComputed(state: State<any>) {
  let value = state.value;
  
  if (currentComputed) currentComputedList.push(currentComputed);
  currentComputed = state;

  try {
    value = state.computedFn!();
  } catch (e) {
    console.error(e);
  }

  currentComputed = currentComputedList.pop();

  return value;
}

function toggleDependencies(state: State<any>, activate: boolean) {
  const shouldToggle = !state.subscribers.length && !state.dependants.length;

  if (shouldToggle) {
    state.dependencies.forEach((dependency) => {
      toggleDependencies(dependency, activate);

      if (activate) {
        dependency.dependants.push(state);
      } else {
        removeFromArray(state.dependants, state);
      }
    });
  }
}
