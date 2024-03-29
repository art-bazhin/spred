import { writable, computed, configure } from '..';
import { effect } from './effect';

describe('watch', () => {
  configure({
    logException: () => {},
  });

  const onException = jest.fn();

  const counter = writable(0);
  const x2Counter = computed(() => {
    const res = counter.get() * 2;

    if (res > 4) throw new Error();

    return res;
  });

  const fn = jest.fn(() => x2Counter.get());

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
