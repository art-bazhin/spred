import { writable } from '../writable/writable';
import { computed } from '../computed/computed';
import { readonly } from '../readonly/readonly';
import { commit } from '../core/core';
import { Atom } from '../atom/atom';
import { TRUE } from '../utils/functions';
import { VOID } from '../void/void';

export type EffectStatus = 'pristine' | 'pending' | 'fulfilled' | 'rejected';

interface EffectStatusObject {
  value: EffectStatus;
  pristine: boolean;
  pending: boolean;
  fulfilled: boolean;
  rejected: boolean;
  settled: boolean;
}

export interface Effect<T, A extends unknown[]> {
  readonly data: Atom<T | VOID>;
  readonly exception: Atom<unknown>;
  readonly done: Atom<unknown>;
  readonly status: Atom<EffectStatusObject>;
  readonly call: (...args: A) => Promise<T>;
  readonly abort: () => void;
  readonly reset: () => void;
}

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
