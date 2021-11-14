import { writable, computed, configure, recalc } from '../main';
import { watch } from './watch';

describe('watch', () => {
  configure({
    logError: () => {},
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
    counter(1);
    recalc();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops to invoke passed function after unsubscribe', () => {
    unsub();

    counter(0);
    recalc();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('invokes error handler if an error occured during calculation', () => {
    const handleError = jest.fn();

    watch(fn, handleError);

    counter(1);
    recalc();

    expect(fn).toHaveBeenCalledTimes(4);
    expect(handleError).toHaveBeenCalledTimes(0);

    counter(10);
    recalc();

    expect(fn).toHaveBeenCalledTimes(4);
    expect(handleError).toHaveBeenCalledTimes(1);

    counter(1);
    recalc();

    expect(fn).toHaveBeenCalledTimes(4);
    expect(handleError).toHaveBeenCalledTimes(1);
  });
});
