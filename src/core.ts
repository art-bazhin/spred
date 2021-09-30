import { Subject } from './subject';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';

export const STATE_KEY = '__spredState__';

let currentComputed: State<any> | undefined;
const currentComputedList: State<any>[] = [];
let calcQueue: State<any>[] = [];

let isCalcActive = false;

function getState<T>(key: Observable<T>): State<T> {
  return (key as any)[STATE_KEY];
}

export function createState<T>(value: T, computedFn?: () => T): State<T> {
  const state: State<T> = {
    value,
    computedFn,
    subscribers: new Set<Subscriber<T>>(),
    dependants: new Set<State<any>>(),
    dependencies: new Set<State<any>>(),
    dirtyCount: 0,
    queueIndex: -1,
    isProcessed: false
  };

  return state;
}

export function setValues<T>(...pairs: [subject: Subject<T>, value: T][]) {
  pairs.forEach(([subject, value], i) => {
    const state = getState(subject);

    if (!checkDirty(state.value, value)) return;

    state.value = value;
    state.queueIndex = i;

    calcQueue.push(state);
  });

  runCalculation();
}

export function subscribe<T>(
  observable: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(observable);
  const value = getStateValue(state);

  toggleDependencies(state, true);

  state.subscribers.add(subscriber);
  subscriber(value);
}

export function unsubscribe<T>(
  subject: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(subject);

  state.subscribers.delete(subscriber);
  toggleDependencies(state, false);
}

function runCalculation() {
  if (isCalcActive) return;
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
  

  for (let i = 0; i < calcQueue.length; i++) {
    const state = calcQueue[i];

    if (state.queueIndex !== i) continue;

    if (!state.computedFn) {
      runSubscribers(state);
    } else {
      if (!state.dirtyCount) {
        decreaseDirtyCount(state);
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

    state.dirtyCount = 0;
    state.queueIndex = -1;
    state.isProcessed = false;
  };

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
  if (currentComputed) {
    const deps = currentComputed.dependencies;

    if (!deps.has(state)) {
      deps.add(state);

      if (
        currentComputed.dependants.size ||
        currentComputed.subscribers.size
      ) {
        state.dependants.add(currentComputed);
      }
    }
  }

  if (state.computedFn) {
    if (
      state.dependants.size ||
      state.subscribers.size
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
  const shouldToggle = !state.subscribers.size && !state.dependants.size;

  if (shouldToggle) {
    state.dependencies.forEach((dependency) => {
      toggleDependencies(dependency, activate);

      if (activate) {
        dependency.dependants.add(state);
      } else {
        dependency.dependants.delete(state);
      }
    });
  }
}
