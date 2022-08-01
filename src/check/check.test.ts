import { computed } from '../computed/computed';
import { writable } from '../writable/writable';
import { check } from './check';

describe('check', () => {
  it('runs passed function', () => {
    const spy = jest.fn();

    check(spy);
    expect(spy).toBeCalledTimes(1);
  });

  it('returns false if passed fn does not contain tracked signal calls', () => {
    const fn = () => 'test';

    expect(check(fn)).toBe(false);

    const signal = writable();
    const fnNoCall = () => signal;

    expect(check(fnNoCall)).toBe(false);
  });

  it('returns true if passed fn contains tracked signal calls', () => {
    const signal = writable();
    const fn = () => signal();

    expect(check(fn)).toBe(true);
  });

  it('does not affect current computed dependencies', () => {
    const signal = writable(0);
    const fn = () => signal();
    const spy = jest.fn(() => {
      check(fn);
    });
    const comp = computed(spy);

    comp.subscribe(() => {});

    signal(1);
    signal(2);
    expect(spy).toBeCalledTimes(1);
  });
});
