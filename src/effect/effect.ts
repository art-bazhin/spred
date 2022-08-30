import { writable } from '../writable/writable';
import { computed } from '../computed/computed';
import { Signal } from '../signal/signal';
import { batch } from '../core/core';
import { NOOP_FN } from '../utils/constants';
import { memo } from '../memo/memo';
import { named } from '../named/named';
import { config } from '../config/config';

export type EffectStatus = 'pristine' | 'pending' | 'fulfilled' | 'rejected';
export type EffectEventName = 'CALL' | 'ABORT' | 'RESET';

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
   * Signal that receives the result of the fulfilled effect.
   */
  readonly data: Signal<T | undefined>;

  /**
   * Signal that receives the result of the rejected effect.
   */
  readonly exception: Signal<unknown>;

  /**
   * Signal that receives any result of the effect, both fulfilled and rejected.
   */
  readonly done: Signal<unknown>;

  /**
   * Signal that receives status object of the effect.
   */
  readonly status: Signal<EffectStatusObject>;

  /**
   * Signal that emits when effect is aborted or reset during execution.
   */
  readonly aborted: Signal<unknown>;

  /**
   * Signal that receives call arguments on every effect call.
   */
  readonly args: Signal<A | undefined>;

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
  asyncFn: (...args: A) => Promise<T>,
  name?: string
) {
  let counter = 0;
  let current = -1;

  const _status = writable<EffectStatus>('pristine');
  const _exception = writable();
  const _data = writable<T>();
  const _aborted = writable();
  const _args = writable<A>();

  const lastStatus = memo(() => {
    const status = _status();
    return status === 'pending' ? undefined : status;
  });

  lastStatus.subscribe(NOOP_FN);

  const status = memo(
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
    (status, prevStatus) => {
      return status.value === prevStatus.value;
    }
  );

  const exception = computed(_exception);

  const done = computed(() => {
    const data = _data();
    const exception = _exception();

    switch (_status.sample()) {
      case 'pristine':
      case 'fulfilled':
        return data;

      case 'rejected':
        return exception;
    }
  });

  const data = computed(_data);
  const aborted = computed(_aborted);
  const args = computed(_args);

  const abort = () => {
    if (!status.sample().pending) return;

    logEvent(name, 'ABORT');

    batch(() => {
      _status(lastStatus() as any);
      _aborted({});
    });

    counter++;
  };

  const reset = () => {
    if (status.sample().pristine) return;

    logEvent(name, 'RESET');

    batch(() => {
      if (status().pending) _aborted({});
      _status('pristine');
    });

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
    logEvent(name, 'CALL', args);

    if (_status.sample() === 'pending') {
      _aborted({});
    }

    _args(args as any);
    _status('pending');

    return exec(++counter, ...args)
      .then((v) => {
        if (current !== counter) return v;

        batch(() => {
          _data(v as any);
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

  if (name) {
    named(data, name + '.data');
    named(exception, name + '.exception');
    named(done, name + '.done');
    named(aborted, name + '.aborted');
    named(args, name + '.args');
    named(status, name + '.status');
  }

  return {
    data,
    exception,
    done,
    aborted,
    args,
    status,
    call,
    abort,
    reset,
  } as Effect<T, A>;
}

function logEvent(
  effectName?: string,
  eventName?: EffectEventName,
  payload?: any
) {
  if (!effectName) return;
  (config as any)._log(effectName, eventName, payload);
}
