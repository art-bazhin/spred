import { State } from '../state/state';
import { FALSE } from '../utils/functions';

let states: State<any>[] = [];
let current: State<any> | undefined;

let length = 0;

function get(this: { status?: boolean }) {
  return this.status;
}

function reset(this: { status?: boolean }) {
  this.status = undefined;
}

function createContainer() {
  return {
    status: true,
    get,
    reset,
  };
}

function createGetter(container: { get: () => any }) {
  return () => container.get();
}

let container = createContainer();
let getter = createGetter(container);

export function push(state: State<any>) {
  if (!length && !state.activeCount) {
    container = createContainer();
    getter = createGetter(container);
  }

  if (!state.activeCount) length++;
  if (current) states.push(current);

  current = state;
  current.isComputing = true;

  current.isCached = FALSE;

  current.dependencies.forEach((dep, i) => {
    dep.currentComputed = current;
    dep.currentComputedIndex = i;
  });

  return current;
}

export function pop() {
  if (current) {
    current.isComputing = false;
    current.isCached = getter;

    if (length) length--;
    if (!length) container.reset();
  }

  current = states.pop();

  if (current) {
    current.dependencies.forEach((dep, i) => {
      dep.currentComputed = current;
      dep.currentComputedIndex = i;
    });
  }

  return current;
}
