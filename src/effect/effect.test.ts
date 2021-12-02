import { configure } from '../main';
import { effect } from './effect';
describe('effect', () => {
  configure({
    logException: () => {},
  });

  const fn = (count: number) => {
    return new Promise<number>((resolve, reject) => {
      if (count > 10) reject('FAIL');
      resolve(count);
    });
  };

  const [effectResult, runEffect] = effect(fn);
  const {
    data,
    exception,
    status,
    pending,
    rejected,
    fulfilled,
    pristine,
    settled,
    reset,
    abort,
  } = effectResult;

  it('is initialized with default state', () => {
    expect(data()).toBeUndefined();
    expect(exception()).toBeUndefined();
    expect(status()).toBe('pristine');
    expect(pristine()).toBe(true);
    expect(pending()).toBe(false);
    expect(fulfilled()).toBe(false);
    expect(rejected()).toBe(false);
    expect(settled()).toBe(false);
    expect(reset).toBeDefined;
    expect(abort).toBeDefined;
  });

  it('has pending status after run', async () => {
    const res = runEffect(5);

    expect(data()).toBeUndefined();
    expect(exception()).toBeUndefined();
    expect(status()).toBe('pending');
    expect(pristine()).toBe(false);
    expect(pending()).toBe(true);
    expect(fulfilled()).toBe(false);
    expect(rejected()).toBe(false);
    expect(settled()).toBe(false);

    await res;
  });

  it('has fulfilled status after success', () => {
    expect(data()).toBe(5);
    expect(exception()).toBeUndefined();
    expect(status()).toBe('fulfilled');
    expect(pristine()).toBe(false);
    expect(pending()).toBe(false);
    expect(fulfilled()).toBe(true);
    expect(rejected()).toBe(false);
    expect(settled()).toBe(true);
  });

  it('has rejected status after error occurance', async () => {
    await runEffect(11).catch(() => {});

    expect(data()).toBe(5);
    expect(exception()).toBe('FAIL');
    expect(status()).toBe('rejected');
    expect(pristine()).toBe(false);
    expect(pending()).toBe(false);
    expect(fulfilled()).toBe(false);
    expect(rejected()).toBe(true);
    expect(settled()).toBe(true);
  });

  it('returns to the last state after abort', async () => {
    const res = runEffect(7);

    abort();
    await res;

    expect(data()).toBe(5);
    expect(exception()).toBe('FAIL');
    expect(status()).toBe('rejected');
    expect(pristine()).toBe(false);
    expect(pending()).toBe(false);
    expect(fulfilled()).toBe(false);
    expect(rejected()).toBe(true);
    expect(settled()).toBe(true);
  });

  it('correctly handles multiple aborts', async () => {
    await runEffect(7);
    const res = runEffect(20).catch(() => {});

    abort();
    abort();
    abort();

    await res;

    expect(data()).toBe(7);
    expect(exception()).toBe('FAIL');
    expect(status()).toBe('fulfilled');
    expect(pristine()).toBe(false);
    expect(pending()).toBe(false);
    expect(fulfilled()).toBe(true);
    expect(rejected()).toBe(false);
    expect(settled()).toBe(true);
  });

  it('returns to the initial state after reset', () => {
    reset();

    expect(data()).toBeUndefined();
    expect(exception()).toBeUndefined();
    expect(status()).toBe('pristine');
    expect(pristine()).toBe(true);
    expect(pending()).toBe(false);
    expect(fulfilled()).toBe(false);
    expect(rejected()).toBe(false);
    expect(settled()).toBe(false);
  });

  it('can work as Promise', async () => {
    expect(await runEffect(3)).toBe(3);
    expect(await runEffect(15).catch((e) => e)).toBe('FAIL');

    let res1 = runEffect(20).catch((e) => e);
    let res2 = runEffect(50).catch((e) => e);
    let res3 = runEffect(5).catch((e) => e);

    expect(await res3).toBe(5);
    expect(await res2).toBe('FAIL');
    expect(await res1).toBe('FAIL');
  });
});
