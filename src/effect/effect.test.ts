import { configure } from '../config/config';
import { VOID } from '../void/void';
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

  const { data, exception, status, reset, abort, call } = effect(fn);

  it('is initialized with default state', () => {
    expect(data()).toBe(VOID);
    expect(exception()).toBe(VOID);
    expect(status().value).toBe('pristine');
    expect(status().pristine).toBe(true);
    expect(status().pending).toBe(false);
    expect(status().fulfilled).toBe(false);
    expect(status().rejected).toBe(false);
    expect(status().settled).toBe(false);
    expect(reset).toBeDefined;
    expect(abort).toBeDefined;
  });

  it('has pending status after run', async () => {
    const res = call(5);

    expect(data()).toBe(VOID);
    expect(exception()).toBe(VOID);
    expect(status().value).toBe('pending');
    expect(status().pristine).toBe(false);
    expect(status().pending).toBe(true);
    expect(status().fulfilled).toBe(false);
    expect(status().rejected).toBe(false);
    expect(status().settled).toBe(false);

    await res;
  });

  it('has fulfilled status after success', () => {
    expect(data()).toBe(5);
    expect(exception()).toBe(VOID);
    expect(status().value).toBe('fulfilled');
    expect(status().pristine).toBe(false);
    expect(status().pending).toBe(false);
    expect(status().fulfilled).toBe(true);
    expect(status().rejected).toBe(false);
    expect(status().settled).toBe(true);
  });

  it('has rejected status after error occurance', async () => {
    await call(11).catch(() => {});

    expect(data()).toBe(5);
    expect(exception()).toBe('FAIL');
    expect(status().value).toBe('rejected');
    expect(status().pristine).toBe(false);
    expect(status().pending).toBe(false);
    expect(status().fulfilled).toBe(false);
    expect(status().rejected).toBe(true);
    expect(status().settled).toBe(true);
  });

  it('returns to the last state after abort', async () => {
    const res = call(7);

    abort();
    await res;

    expect(data()).toBe(5);
    expect(exception()).toBe('FAIL');
    expect(status().value).toBe('rejected');
    expect(status().pristine).toBe(false);
    expect(status().pending).toBe(false);
    expect(status().fulfilled).toBe(false);
    expect(status().rejected).toBe(true);
    expect(status().settled).toBe(true);
  });

  it('correctly handles multiple aborts', async () => {
    await call(7);
    const res = call(20).catch(() => {});

    abort();
    abort();
    abort();

    await res;

    expect(data()).toBe(7);
    expect(exception()).toBe('FAIL');
    expect(status().value).toBe('fulfilled');
    expect(status().pristine).toBe(false);
    expect(status().pending).toBe(false);
    expect(status().fulfilled).toBe(true);
    expect(status().rejected).toBe(false);
    expect(status().settled).toBe(true);
  });

  it('returns to the pristine status after reset', () => {
    reset();

    expect(status().value).toBe('pristine');
    expect(status().pristine).toBe(true);
    expect(status().pending).toBe(false);
    expect(status().fulfilled).toBe(false);
    expect(status().rejected).toBe(false);
    expect(status().settled).toBe(false);
  });

  it('can work as Promise', async () => {
    expect(await call(3)).toBe(3);
    expect(await call(15).catch((e) => e)).toBe('FAIL');

    let res1 = call(20).catch((e) => e);
    let res2 = call(50).catch((e) => e);
    let res3 = call(5).catch((e) => e);

    expect(await res3).toBe(5);
    expect(await res2).toBe('FAIL');
    expect(await res1).toBe('FAIL');
  });
});
