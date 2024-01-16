import { writable, computed, configure } from '..';
import { watch } from './watch';

describe('watch', () => {
  configure({
    logException: () => {},
  });

  const counter = writable(0);
  const x2Counter = computed(() => {
    const res = counter() * 2;

    if (res > 4) throw new Error();

    return res;
  });

  const fn = jest.fn(() => x2Counter());

  let unsub: () => any;

  it('immediately invokes passed function', () => {
    unsub = watch(fn);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invokes passed function on dependency change', () => {
    counter.set(1);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops to invoke passed function after unsubscribing', () => {
    unsub();

    counter.set(0);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('can receive a signal as argument', () => {
    const spy = jest.fn();
    const count = writable(0);
    const double = computed(() => {
      spy();
      return count() * 2;
    });

    watch(double);
    expect(spy).toBeCalledTimes(1);

    count.set(1);
    expect(spy).toBeCalledTimes(2);
  });
});
