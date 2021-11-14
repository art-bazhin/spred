import { on } from '../signal/signal';
import { getAtomSignal, Atom, _Atom } from '../atom/atom';

export function onActivate<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal(atom, 'activate'), listener);
}

export function onDeactivate<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal(atom, 'deactivate'), listener);
}

export function onChange<T>(
  atom: Atom<T>,
  listener: (change: { value: T; prevValue: T | undefined }) => any
) {
  return on(getAtomSignal(atom, 'change'), listener);
}

export function onException<T>(atom: Atom<T>, listener: (e: unknown) => any) {
  return on(getAtomSignal(atom, 'exception'), listener);
}

export function onNotifyStart<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal(atom, 'notifyStart'), listener);
}

export function onNotifyEnd<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal(atom, 'notifyEnd'), listener);
}
