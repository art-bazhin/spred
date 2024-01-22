import { Signal, WritableSignal } from '../core/core';

/**
 * Checks if the passed value is a {@link Signal}
 * @param value A value to check.
 * @returns True if the value is a {@link Signal}, false otherwise.
 */
export function isSignal(value: unknown): value is Signal<unknown>;

export function isSignal(value: any) {
  return value instanceof Signal;
}

/**
 * Checks if the passed value is a {@link WritableSignal}
 * @param value A value to check.
 * @returns True if the value is a {@link WritableSignal}, false otherwise.
 */
export function isWritableSignal(
  value: unknown,
): value is WritableSignal<unknown>;

export function isWritableSignal(value: any) {
  return value instanceof WritableSignal;
}
