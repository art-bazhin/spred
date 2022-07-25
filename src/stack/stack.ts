import { State } from '../state/state';
import { FALSE_STATUS } from '../utils/constants';

let states: State<any>[] = [];
let current: State<any> | undefined;
let length = 0;

let container = { status: true };

export function push(state: State<any>) {
  if (!length && !state.observers.size) {
    container = { status: true };
  }

  if (!state.observers.size) length++;
  if (current) states.push(current);

  current = state;
  current.isComputing = true;

  current.isCached = FALSE_STATUS;

  return current;
}

export function pop() {
  if (current) {
    current.isComputing = false;
    current.isCached = container;

    if (length) length--;
    if (!length) container.status = false;
  }

  current = states.pop();

  return current;
}
