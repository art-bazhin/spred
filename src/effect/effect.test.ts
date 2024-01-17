import { configure } from '../config/config';
import { on } from '../on/on';
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

  const { data, exception, status, done, aborted, args, reset, abort, call } =
    effect(fn);

  it('is initialized with default state', () => {
    expect(data.get()).toBe(undefined);
    expect(exception.get()).toBe(undefined);
    expect(status.get().value).toBe('pristine');
    expect(status.get().pristine).toBe(true);
    expect(status.get().pending).toBe(false);
    expect(status.get().fulfilled).toBe(false);
    expect(status.get().rejected).toBe(false);
    expect(status.get().settled).toBe(false);
    expect(reset).toBeDefined;
    expect(abort).toBeDefined;
  });

  it('has pending status after run', async () => {
    const res = call(5);

    expect(data.get()).toBe(undefined);
    expect(exception.get()).toBe(undefined);
    expect(status.get().value).toBe('pending');
    expect(status.get().pristine).toBe(false);
    expect(status.get().pending).toBe(true);
    expect(status.get().fulfilled).toBe(false);
    expect(status.get().rejected).toBe(false);
    expect(status.get().settled).toBe(false);

    await res;
  });

  it('has fulfilled status after success', () => {
    expect(data.get()).toBe(5);
    expect(exception.get()).toBe(undefined);
    expect(status.get().value).toBe('fulfilled');
    expect(status.get().pristine).toBe(false);
    expect(status.get().pending).toBe(false);
    expect(status.get().fulfilled).toBe(true);
    expect(status.get().rejected).toBe(false);
    expect(status.get().settled).toBe(true);
  });

  it('has rejected status after error occurance', async () => {
    await call(11).catch(() => {});

    expect(data.get()).toBe(5);
    expect(exception.get()).toBe('FAIL');
    expect(status.get().value).toBe('rejected');
    expect(status.get().pristine).toBe(false);
    expect(status.get().pending).toBe(false);
    expect(status.get().fulfilled).toBe(false);
    expect(status.get().rejected).toBe(true);
    expect(status.get().settled).toBe(true);
  });

  it('returns to the last state after abort', async () => {
    const res = call(7);

    abort();
    await res;

    expect(data.get()).toBe(5);
    expect(exception.get()).toBe('FAIL');
    expect(status.get().value).toBe('rejected');
    expect(status.get().pristine).toBe(false);
    expect(status.get().pending).toBe(false);
    expect(status.get().fulfilled).toBe(false);
    expect(status.get().rejected).toBe(true);
    expect(status.get().settled).toBe(true);
  });

  it('correctly handles multiple aborts', async () => {
    await call(7);
    const res = call(20).catch(() => {});

    abort();
    abort();
    abort();

    await res;

    expect(data.get()).toBe(7);
    expect(exception.get()).toBe('FAIL');
    expect(status.get().value).toBe('fulfilled');
    expect(status.get().pristine).toBe(false);
    expect(status.get().pending).toBe(false);
    expect(status.get().fulfilled).toBe(true);
    expect(status.get().rejected).toBe(false);
    expect(status.get().settled).toBe(true);
  });

  it('returns to the pristine status after reset', () => {
    reset();

    expect(status.get().value).toBe('pristine');
    expect(status.get().pristine).toBe(true);
    expect(status.get().pending).toBe(false);
    expect(status.get().fulfilled).toBe(false);
    expect(status.get().rejected).toBe(false);
    expect(status.get().settled).toBe(false);
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

  describe('data signal', () => {
    it('emits a successful result of the effect call', async () => {
      const spy = jest.fn();
      let res: any;

      reset();

      on(data, (value) => {
        res = value;
        spy();
      });

      expect(spy).toBeCalledTimes(0);

      await call(1);
      expect(spy).toBeCalledTimes(1);
      expect(res).toBe(1);

      await call(2);
      expect(spy).toBeCalledTimes(2);
      expect(res).toBe(2);

      await call(20).catch(() => {});
      expect(spy).toBeCalledTimes(2);
      expect(res).toBe(2);

      await call(3);
      expect(spy).toBeCalledTimes(3);
      expect(res).toBe(3);
    });
  });

  describe('exception signal', () => {
    it('emits an exception thrown by effect', async () => {
      const spy = jest.fn();
      let res: any;

      reset();

      on(exception, (value) => {
        res = value;
        spy();
      });

      expect(spy).toBeCalledTimes(0);

      await call(1);
      expect(spy).toBeCalledTimes(0);
      expect(res).toBe(undefined);

      await call(2);
      expect(spy).toBeCalledTimes(0);
      expect(res).toBe(undefined);

      await call(20).catch(() => {});
      expect(spy).toBeCalledTimes(1);
      expect(res).toBe('FAIL');

      await call(3);
      expect(spy).toBeCalledTimes(1);
      expect(res).toBe('FAIL');
    });
  });

  describe('done signal', () => {
    it('emits a successful result of the effect call or an exception', async () => {
      const spy = jest.fn();
      let res: any;

      reset();

      on(done, (value) => {
        res = value;
        spy();
      });

      expect(spy).toBeCalledTimes(0);

      await call(1);
      expect(spy).toBeCalledTimes(1);
      expect(res).toBe(1);

      await call(2);
      expect(spy).toBeCalledTimes(2);
      expect(res).toBe(2);

      await call(20).catch(() => {});
      expect(spy).toBeCalledTimes(3);
      expect(res).toBe('FAIL');
    });
  });

  describe('aborted signal', () => {
    it('emits when effect is aborted or reset during execution', async () => {
      const spy = jest.fn();
      reset();

      on(aborted, spy);
      expect(spy).toBeCalledTimes(0);

      await call(1);
      expect(spy).toBeCalledTimes(0);

      const res1 = call(2);
      abort();
      await res1;
      expect(spy).toBeCalledTimes(1);

      abort();
      expect(spy).toBeCalledTimes(1);

      const res2 = call(3);
      reset();
      await res2;
      expect(spy).toBeCalledTimes(2);

      const res3 = call(4);
      call(5);
      await res3;
      expect(spy).toBeCalledTimes(3);

      reset();
      expect(spy).toBeCalledTimes(3);
    });
  });

  describe('args signal', () => {
    it('receives call arguments on every effect call', async () => {
      let lastArgs: any;

      const spy = jest.fn();
      const sub = (value: any) => {
        spy();
        lastArgs = value;
      };

      reset();

      on(args, sub);
      expect(spy).toBeCalledTimes(0);

      await call(1);
      expect(spy).toBeCalledTimes(1);
      expect(lastArgs[0]).toBe(1);

      const res1 = call(2);
      expect(spy).toBeCalledTimes(2);
      await res1;
      expect(lastArgs[0]).toBe(2);

      call(3);
      const res2 = call(4);
      expect(spy).toBeCalledTimes(4);
      await res2;
      expect(lastArgs[0]).toBe(4);
    });
  });
});
