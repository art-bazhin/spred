import { Subject } from './subject';
import { Observable } from './observable';
import { State } from './state';
import { Subscriber } from './subscriber';

export const STATE_KEY = '__spredState__';

const currentComputed: State<any>[] = [];
const calcQueue = new Set<State<any>>();

let isCalcActive = false;
let isCacheUsed = false;

function getState<T>(key: Observable<T>): State<T> {
  return (key as any)[STATE_KEY];
}

export function createState<T>(value: T, computedFn?: () => T): State<T> {
  const state: State<T> = {
    value,
    computedFn,
    totalSubscribers: 0,
    subscribers: new Set<Subscriber<T>>(),
    dependants: new Set<State<any>>(),
    dependencies: new Set<State<any>>(),
    isDirty: !!computedFn,
    dirtyCount: 0,
  };

  return state;
}

export function getValue<T>(key: Observable<T>): T {
  const state = getState(key);
  return getStateValue(state);
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
  subject: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(subject);
  const value = getStateValue(state, true);

  activateDependencies(state);

  state.subscribers.add(subscriber);
  subscriber(value);
}

export function unsubscribe<T>(
  subject: Observable<T>,
  subscriber: Subscriber<T>
) {
  const state = getState(subject);

  state.subscribers.delete(subscriber);
  deactivateDependencies(state);
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

function getStateValue<T>(state: State<T>, activateCaching = false): T {
  if (activateCaching) isCacheUsed = true;

  if (currentComputed[0]) {
    const comp = currentComputed[0];
    const deps = comp.dependencies;

    if (!deps.has(state)) {
      deps.add(state);

      if (
        currentComputed[0].dependants.size ||
        currentComputed[0].subscribers.size
      ) {
        state.dependants.add(comp);
      }
    }
  }

  if (state.computedFn) {
    if (
      (isCacheUsed && !state.isDirty) ||
      state.dependants.size ||
      state.subscribers.size
    )
      return state.value;

    state.value = calcComputed(state);
    state.isDirty = false;
  }

  if (activateCaching) isCacheUsed = false;

  return state.value;
}

function checkDirty(prevValue: any, nextValue: any) {
  return prevValue !== nextValue;
}

function calcComputed(state: State<any>) {
  let value = state.value;
  currentComputed.unshift(state);

  try {
    value = state.computedFn!();
  } catch (e) {
    console.error(e);
  }

  currentComputed.shift();
  return value;
}

function activateDependencies(state: State<any>) {
  const shouldActivate = !state.subscribers.size && !state.dependants.size;

  if (shouldActivate) {
    state.dependencies.forEach((dependency) => {
      activateDependencies(dependency);
      dependency.dependants.add(state);
    });
  }
}

function deactivateDependencies(state: State<any>) {
  const shouldDeactivate = !state.subscribers.size && !state.dependants.size;

  if (shouldDeactivate) {
    state.dependencies.forEach((dependency) => {
      dependency.dependants.delete(state);
      dependency.isDirty = !!dependency.computedFn;
      deactivateDependencies(dependency);
    });
  }
}
