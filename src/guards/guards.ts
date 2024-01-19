import { Signal, WritableSignal } from '../core/core';

export function isSignal(value: unknown): value is Signal<unknown>;
export function isSignal(value: any) {
  return value instanceof Signal;
}

export function isWritableSignal(
  value: unknown,
): value is WritableSignal<unknown>;

export function isWritableSignal(value: any) {
  return value instanceof WritableSignal;
}

export function getValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.get() : value;
}

export function sampleValue<T>(value: T | Signal<T>) {
  return isSignal(value) ? value.get(false) : value;
}
