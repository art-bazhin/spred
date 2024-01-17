import { Signal, get } from '../core/core';
import { WritableSignal } from '../writable/writable';

export function isSignal(value: unknown): value is Signal<unknown>;
export function isSignal(value: any) {
  return value.get === get;
}

export function isWritableSignal(
  value: unknown,
): value is WritableSignal<unknown>;

export function isWritableSignal(value: any) {
  return value.get === get && !value._compute;
}

export function getValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.get() : value;
}

export function sampleValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.get(false) : value;
}
