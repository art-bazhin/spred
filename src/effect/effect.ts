import { signal } from '../signal/signal';
import { computed } from '../computed/computed';
import { readonly } from '../readonly/readonly';
import { Signal } from '../signal-base/signal-base';
import { batch } from '../core/core';

export type EffectStatus = 'pristine' | 'pending' | 'fulfilled' | 'rejected';

export interface EffectStatusObject {
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
  readonly data: Signal<T | undefined>;

  /**
   * Atom that receives the result of the rejected effect.
   */
  readonly exception: Signal<unknown>;

  /**
   * Atom that receives any result of the effect, both fulfilled and rejected.
   */
  readonly done: Signal<unknown>;

  /**
   * Atom that receives status object of the effect.
   */
  readonly status: Signal<EffectStatusObject>;

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

  const _status = signal<EffectStatus>('pristine');
  const _exception = signal();
  const _data = signal<T>();

  const lastStatus = computed(() => {
    const status = _status();
    return status === 'pending' ? undefined : status;
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
    null
    // (status, prevStatus) => {
    //   return status.value !== prevStatus.value;
    // }
  );

  const exception = readonly(_exception);

  const done = computed((last) => {
    const data = _data();
    const exception = _exception();

    switch (_status()) {
      case 'pristine':
      case 'fulfilled':
        return data;

      case 'rejected':
        return exception;

      default:
        return last;
    }
  });

  const data = readonly(_data);

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

        batch(() => {
          _data(v);
          _status('fulfilled');
        });

        return v;
      })
      .catch((e) => {
        if (current !== counter) throw e;

        batch(() => {
          _exception(e);
          _status('rejected');
        });

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
