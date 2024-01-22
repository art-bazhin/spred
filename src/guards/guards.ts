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
