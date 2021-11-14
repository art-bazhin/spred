import { noncallable, on, oSignalEnd, onSignalStart, signal } from './signal';

describe('Signal', () => {
  const foo = signal<number>();
  let unsub: any;

  let payload = 0;

  const listener = jest.fn((value: number) => {
    payload = value;
  });

  it('is created by the signal function', () => {
    expect(foo).toBeDefined();
    expect(foo).toBeInstanceOf(Function);
  });

  it('triggers listeners and passes the payload as an argument', () => {
    unsub = on(foo, listener);
    foo(10);

    expect(listener).toBeCalledTimes(1);
    expect(payload).toBe(10);
  });

  it('does not subscribe to the same listener more than once', () => {
    on(foo, () => {});
    on(foo, listener);

    foo(20);

    expect(listener).toBeCalledTimes(2);
    expect(payload).toBe(20);
  });

  it('stops firing the listener after unsubscribing', () => {
    unsub();

    foo(30);

    expect(listener).toBeCalledTimes(2);
    expect(payload).toBe(20);
  });
});

describe('onSignalStart function', () => {
  it('sets a function to run before triggering signal listeners', () => {
    const foo = signal();
    const result: any = {};

    let order = 0;

    on(foo, () => (result.listener = ++order));
    onSignalStart(foo, () => (result.berforeListener = ++order));

    foo();

    expect(result.berforeListener).toBe(1);
    expect(result.listener).toBe(2);
  });
});

describe('onSignalEnd function', () => {
  it('sets a function to run after triggering signal listeners', () => {
    const foo = signal();
    const result: any = {};

    let order = 0;

    on(foo, () => (result.listener = ++order));
    oSignalEnd(foo, () => (result.afterListener = ++order));

    foo();

    expect(result.listener).toBe(1);
    expect(result.afterListener).toBe(2);
  });
});

describe('noncallable function', () => {
  it('creates a noncallable copy of the callable signal', () => {
    const foo = signal();
    const noncallableFoo = noncallable(foo);
    const listener = jest.fn();

    on(noncallableFoo, listener);
    foo();

    expect(listener).toBeCalled();
    expect(noncallableFoo).not.toBeInstanceOf(Function);
  });
});
