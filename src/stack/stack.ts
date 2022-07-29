import { State } from '../state/state';
import { FALSE_STATUS } from '../utils/constants';

let current: State<any> | undefined;
let length = 0;
let container = { status: true };

export function push(state?: State<any>) {
  if (!state) {
    current = state;
    container = { status: true };
    length = 0;
    return;
  }

  if (!state.observers.size) {
    if (!length) container = { status: true };
    ++length;
  }

  current = state;
  current.isComputing = true;
  current.isCached = FALSE_STATUS;
  current.oldDepsCount = state.dependencies.size;
  current.hasException = false;

  return current;
}

export function pop(state?: State<any> | undefined) {
  if (current) {
    current.isComputing = false;
    current.isCached = container;

    if (length) --length;
    if (!length) container.status = false;
  }

  current = state;

  return current;
}

export function storeStackValues() {
  const _container = container;
  const _length = length;
  const _current = current;

  return () => {
    container = _container;
    length = _length;
    current = _current;

    return current;
  };
}
