import { writable } from '../writable/writable';
import { computed } from '../computed/computed';
import { readonly } from '../readonly/readonly';
import { commit } from '../core/core';
import { Atom } from '../atom/atom';
import { TRUE } from '../utils/functions';
import { VOID } from '../void/void';

export type EffectStatus = 'pristine' | 'pending' | 'fulfilled' | 'rejected';

interface EffectStatusObject {
  readonly value: EffectStatus;
  readonly pristine: boolean;
  readonly pending: boolean;
  readonly fulfilled: boolean;
  readonly rejected: boolean;
  readonly settled: boolean;
}

/**
 * Wrapper for asynchronous function.
 */
export interface Effect<T, A extends unknown[]> {
  /**
   * Atom that receives the result of the fulfilled effect.
   */
  readonly data: Atom<T | VOID>;

  /**
   * Atom that receives the result of the rejected effect.
   */
  readonly exception: Atom<unknown>;

  /**
   * Atom that receives any result of the effect, both fulfilled and rejected.
   */
  readonly done: Atom<unknown>;

  /**
   * Atom that receives status object of the effect.
   */
  readonly status: Atom<EffectStatusObject>;

  /**
   * Calls the effect.
   */
  readonly call: (...args: A) => Promise<T>;

  /**
   * Aborts the effect and returns it to its last state.
   */
  readonly abort: () => void;

  /**
   * Aborts the effect and sets it to pristine status.
   */
  readonly reset: () => void;
}

/**
 * Creates an effect from asynchronous function.
 * @param asyncFn Asynchronous function
 * @returns Effect.
 */
export function effect<T, A extends unknown[]>(
  asyncFn: (...args: A) => Promise<T>
) {
  let counter = 0;
  let current = -1;

  const _status = writable<EffectStatus>('pristine');
  const _exception = writable<unknown>(VOID, TRUE);
  const _data = writable<T | VOID>(VOID, TRUE);

  const lastStatus = computed(() => {
    const status = _status();
    return status === 'pending' ? VOID : status;
  }, null);

  lastStatus.activate();

  const status = computed(
    () => {
      const value = _status();

      return {
        value,
        pristine: value === 'pristine',
        pending: value === 'pending',
        fulfilled: value === 'fulfilled',
        rejected: value === 'rejected',
        settled: value === 'fulfilled' || value === 'rejected',
      };
    },
    null,
    (status, prevStatus) => {
      return status.value !== prevStatus.value;
    }
  );

  const exception = readonly(_exception);

  const done = computed((last) => {
    switch (_status()) {
      case 'pristine':
      case 'fulfilled':
        return _data();

      case 'rejected':
        return _exception();

      default:
        return last;
    }
  });

  const data = computed(
    () => {
      if (status().rejected) throw _exception();
      return _data();
    },
    null,
    TRUE
  );

  const abort = () => {
    if (!status().pending) return;
    _status(lastStatus() as any);
    counter++;
  };

  const reset = () => {
    _status('pristine');
    counter++;
  };

  const exec = (id: number, ...args: A) => {
    return asyncFn(...args)
      .then((res) => {
        current = id;
        return res;
      })
      .catch((e) => {
        current = id;
        throw e;
      });
  };

  const call = (...args: A) => {
    _status('pending');

    return exec(++counter, ...args)
      .then((v) => {
        if (current !== counter) return v;
        commit([
          [_data, v],
          [_status, 'fulfilled'],
        ]);
        return v;
      })
      .catch((e) => {
        if (current !== counter) throw e;
        commit([
          [_exception, e],
          [_status, 'rejected'],
        ]);
        throw e;
      });
  };

  return {
    data,
    exception,
    done,
    status,
    call,
    abort,
    reset,
  } as Effect<T, A>;
}
