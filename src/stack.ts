import { State } from "./state";

let states: State<any>[] = [];
let current: State<any> | undefined;

export function push(state: State<any>) {
  if (current) states.push(current);
  current = state;

  return current;
};

export function pop() {
  current = states.pop();
  return current;
}