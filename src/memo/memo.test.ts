import { signal } from '..';
import { memo } from './memo';

describe('memo', () => {
  it('creates a computed which does not trigger dependants until its value is changed', () => {
    const counter = signal(0);
    const x2Counter = memo(() => counter() * 2);
    const spy = jest.fn();

    x2Counter.subscribe(spy, false);

    expect(counter()).toBe(0);
    expect(x2Counter()).toBe(0);
    expect(spy).toBeCalledTimes(0);

    counter(0);
    expect(counter()).toBe(0);
    expect(x2Counter()).toBe(0);
    expect(spy).toBeCalledTimes(0);

    counter(1);
    expect(counter()).toBe(1);
    expect(x2Counter()).toBe(2);
    expect(spy).toBeCalledTimes(1);

    counter(2);
    expect(counter()).toBe(2);
    expect(x2Counter()).toBe(4);
    expect(spy).toBeCalledTimes(2);

    counter(2);
    expect(counter()).toBe(2);
    expect(x2Counter()).toBe(4);
    expect(spy).toBeCalledTimes(2);
  });
});
