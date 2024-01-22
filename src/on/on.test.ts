import { signal } from '../signal/signal';
import { on } from './on';

describe('on function', () => {
  it('subscribes the passed callback to the signal without executing it immediately', () => {
    const counter = signal(0);
    const spy = jest.fn();

    on(counter, spy);
    expect(spy).toHaveBeenCalledTimes(0);

    counter.set(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
