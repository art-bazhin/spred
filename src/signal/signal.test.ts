import { on, signal } from './signal';

describe('signal', () => {
  const foo = signal<number>();
  let unsub: any;

  let payload = 0;

  const listener = jest.fn((value: number) => {
    payload = value;
  });

  it('is created by signal function', () => {
    expect(foo).toBeDefined();
    expect(foo).toBeInstanceOf(Function);
  });

  it('triggers listeners and pass the payload as argument', () => {
    unsub = on(foo, listener);
    foo(10);

    expect(listener).toBeCalledTimes(1);
    expect(payload).toBe(10);
  });

  it('does not subscribe same listener more than one time', () => {
    on(foo, () => {});
    on(foo, listener);

    foo(20);

    expect(listener).toBeCalledTimes(2);
    expect(payload).toBe(20);
  });

  it('stops to trigger listener after unsubscribe', () => {
    unsub();

    foo(30);

    expect(listener).toBeCalledTimes(2);
    expect(payload).toBe(20);
  });
});
