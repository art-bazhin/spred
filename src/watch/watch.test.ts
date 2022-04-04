import { createWritable, createComputed, configure } from '..';
import { watch } from './watch';

describe('watch', () => {
  configure({
    logException: () => {},
  });

  const counter = createWritable(0);
  const x2Counter = createComputed(() => {
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

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops to invoke passed function after unsubscribing', () => {
    unsub();

    counter(0);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
