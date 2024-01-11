import { Signal } from '../signal/signal';
import { Computation } from '../core/core';
import { WritableSignal } from '../writable/writable';
import { VOID } from '../utils/constants';

export function isSignal<T>(
  value: Computation<T>,
): value is Signal<Exclude<T, typeof VOID>>;
export function isSignal<T>(
  value: (...args: unknown[]) => T,
): value is Signal<Exclude<T, typeof VOID>>;
export function isSignal(value: unknown): value is Signal<unknown>;
export function isSignal(value: any) {
  return value._state && value.get;
}

export function isWritableSignal<T>(
  value: (...args: unknown[]) => T,
): value is WritableSignal<T>;

export function isWritableSignal<T>(
  value: Computation<T>,
): value is WritableSignal<T>;

export function isWritableSignal(
  value: unknown,
): value is WritableSignal<unknown>;

export function isWritableSignal(value: any) {
  return isSignal(value) && (value as any).set;
}

export function isStore<T>(
  value: (...args: unknown[]) => T,
): value is WritableSignal<T>;

export function isStore<T>(value: Computation<T>): value is WritableSignal<T>;

export function isStore(value: unknown): value is WritableSignal<unknown>;

export function isStore(value: any) {
  return isSignal(value) && (value as any).update;
}

export function getValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value() : value;
}

export function sampleValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.sample() : value;
}
