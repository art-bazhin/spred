import { State } from '../state/state';

let states: State<any>[] = [];
let current: State<any> | undefined;
let shouldActivate: boolean = false;

export function push(state: State<any>) {
  if (current) states.push(current);

  current = state;
  current.isComputing = true;

  if (shouldActivate) current.isActive = true;

  return current;
}

export function pop() {
  if (current) current.isComputing = false;
  current = states.pop();
  return current;
}

export function activateNested(value: boolean) {
  shouldActivate = value;
}
