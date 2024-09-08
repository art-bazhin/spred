import { signal, configure, effect } from '..';

describe('effect', () => {
  configure({
    logException: () => {},
  });

  const onException = jest.fn();

  const counter = signal(0);
  const x2Counter = signal((get) => {
    const res = get(counter) * 2;

    if (res > 4) throw new Error();

    return res;
  });

  const fn = jest.fn((get: any) => get(x2Counter));

  let unsub: () => any;

  it('immediately invokes passed function', () => {
    unsub = effect(fn, { onException });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invokes passed function on dependency change', () => {
    counter.set(1);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses passed options', () => {
    expect(onException).toHaveBeenCalledTimes(0);

    counter.set(5);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onException).toHaveBeenCalledTimes(1);
  });

  it('stops to invoke passed function after unsubscribing', () => {
    unsub();

    counter.set(0);

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
