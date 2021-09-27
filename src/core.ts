import { Subject } from './subject';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';

export const STATE_KEY = '__spredState__';

let currentComputed: State<any> | undefined;
const currentComputedList: State<any>[] = [];
const calcQueue = new Set<State<any>>();

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
  };

  return state;
}

export function getValue<T>(key: Observable<T>): T {
  return getStateValue(getState(key));
}

export function setValues<T>(...pairs: [subject: Subject<T>, value: T][]) {
  pairs.forEach(([subject, value]) => {
    const state = getState(subject);

    if (!checkDirty(state.value, value)) return;

    state.value = value;

    calcQueue.add(state);
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

  calcQueue.forEach((state) => {
    state.dependants.forEach((dependant) => {
      calcQueue.delete(dependant);
      calcQueue.add(dependant);
      dependant.dirtyCount++;
    });
  });

  calcQueue.forEach((state) => {
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
  });

  calcQueue.clear();
  isCalcActive = false;
}

function decreaseDirtyCount(state: State<any>) {
  state.dependants.forEach((dependant) => dependant.dirtyCount--);
}

function runSubscribers(state: State<any>) {
  state.subscribers.forEach((subscriber) => subscriber(state.value));
}

function getStateValue<T>(state: State<T>): T {
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
  
  if (currentComputed) currentComputedList.push(state);
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
