import { Signal } from '../signal/signal';
import { WritableSignal } from '../writable/writable';

export function isSignal<T>(value: (...args: any) => T): value is Signal<T>;
export function isSignal(value: any): value is Signal<unknown>;
export function isSignal(value: any) {
  return (value as any)._state && (value as any).subscribe;
}

export function isWritableSignal<T>(
  value: (...args: any) => T
): value is WritableSignal<T>;
export function isWritableSignal(value: any): value is WritableSignal<unknown>;
export function isWritableSignal(value: any) {
  return isSignal(value) && (value as any).set;
}

export function get<T>(value: T | Signal<T>) {
  return isSignal(value) ? value() : value;
}

export function sample<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.sample() : value;
}
