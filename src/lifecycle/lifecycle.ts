import { on } from '../on/on';
import { Atom, _Atom } from '../atom/atom';
import { signal } from '../signal/signal';

function getAtomSignal<T>(atom: Atom<any>, signalName: string) {
  const signals = (atom as any)._state.signals;
  if (!signals[signalName]) signals[signalName] = signal();
  return signals[signalName][0] as Atom<T>;
}

export function onActivate<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal(atom, 'activate'), listener);
}

export function onDeactivate<T>(atom: Atom<T>, listener: (value: T) => any) {
  return on(getAtomSignal(atom, 'deactivate'), listener);
}

export function onUpdate<T>(
  atom: Atom<T>,
  listener: (change: { value: T; prevValue: T | undefined }) => any
) {
  return on(getAtomSignal(atom, 'update'), listener);
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
