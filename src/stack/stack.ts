import { State } from '../state/state';

let states: State<any>[] = [];
let current: State<any> | undefined;

export function push(state: State<any>) {
  if (current) states.push(current);
  current = state;
  current.isComputing = true;

  return current;
}

export function pop() {
  if (current) current.isComputing = false;
  current = states.pop();
  return current;
}
