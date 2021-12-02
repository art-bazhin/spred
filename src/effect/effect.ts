import { writable } from '../writable/writable';
import { computed } from '../computed/computed';
import { readonly } from '../readonly/readonly';

type EffectStatus = 'pristine' | 'pending' | 'fulfilled' | 'rejected';

export function effect<T, A extends unknown[]>(
  asyncFn: (...args: A) => Promise<T>
) {
  let counter = 0;
  let current = -1;

  const _status = writable<EffectStatus>('pristine');
  const _exception = writable<unknown>(undefined);
  const _data = writable<T | undefined>(undefined);

  const status = readonly(_status);
  const lastStatus = computed(
    () => _status(),
    null,
    (value) => value !== 'pending'
  );

  lastStatus.activate();

  const pristine = computed(() => _status() === 'pristine');
  const pending = computed(() => _status() === 'pending');
  const fulfilled = computed(() => _status() === 'fulfilled');
  const rejected = computed(() => _status() === 'rejected');
  const settled = computed(() => fulfilled() || rejected());

  const exception = readonly(_exception);

  const data = computed(() => {
    if (rejected()) throw _exception();
    return _data();
  });

  const abort = () => {
    if (!pending()) return;
    _status(lastStatus()!);
    counter++;
  };

  const reset = () => {
    _status('pristine');
    _data(undefined);
    _exception(undefined);
    counter++;
  };

  const run = (id: number, ...args: A) => {
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

  return [
    {
      data,
      exception,
      status,
      pristine,
      pending,
      fulfilled,
      rejected,
      settled,
      abort,
      reset,
    },
    (...args: A) => {
      _status('pending');

      return run(++counter, ...args)
        .then((v) => {
          if (current !== counter) return v;

          _data(v);
          _status('fulfilled');

          return v;
        })
        .catch((e) => {
          if (current !== counter) throw e;

          _exception(e);
          _status('rejected');

          throw e;
        });
    },
  ] as const;
}
