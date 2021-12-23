import { Signal } from '../signal-base/signal-base';
import { WritableSignal } from '../signal/signal';

export function isSignal<T>(value: (...args: any) => T): value is Signal<T> {
  return (value as any)._state && (value as any).subscribe;
}

export function isWritableSignal<T>(
  value: (...args: any) => T
): value is WritableSignal<T> {
  return isSignal(value) && (value as any).set;
}
