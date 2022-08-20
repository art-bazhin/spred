import { Signal } from '../signal/signal';
import { Computation } from '../state/state';
import { WritableSignal } from '../writable/writable';

export function isSignal<T>(value: Computation<T>): value is Signal<T>;
export function isSignal<T>(
  value: (...args: unknown[]) => T
): value is Signal<T>;
export function isSignal(value: unknown): value is Signal<unknown>;
export function isSignal(value: any) {
  return value._state && value.subscribe;
}

export function isWritableSignal<T>(
  value: (...args: unknown[]) => T
): value is WritableSignal<T>;

export function isWritableSignal<T>(
  value: Computation<T>
): value is WritableSignal<T>;

export function isWritableSignal(
  value: unknown
): value is WritableSignal<unknown>;

export function isWritableSignal(value: any) {
  return isSignal(value) && (value as any).set;
}

export function getValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value() : value;
}

export function sampleValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.sample() : value;
}
