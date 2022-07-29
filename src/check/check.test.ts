import { createWritable } from '../writable/writable';
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

    const signal = createWritable();
    const fnNoCall = () => signal;

    expect(check(fnNoCall)).toBe(false);
  });

  it('returns true if passed fn contains tracked signal calls', () => {
    const signal = createWritable();
    const fn = () => signal();

    expect(check(fn)).toBe(true);
  });
});
