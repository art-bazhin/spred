import { signal, action } from '..';

describe('action', () => {
  const source = signal(0);
  const spy = jest.fn();

  let lastArgs: any;

  function fn(this: any, ...args: any) {
    source.set(1);
    source.set(2);
    source.set(3);

    lastArgs = args;

    return this;
  }

  let obj = {
    act: action(fn),
  };

  source.subscribe(spy);

  it('batches updates', () => {
    obj.act();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('passes arguments to the wrapped function', () => {
    obj.act(0, 1, 2);

    expect(lastArgs[0]).toBe(0);
    expect(lastArgs[1]).toBe(1);
    expect(lastArgs[2]).toBe(2);
  });

  it('passes context to the wrapped function', () => {
    expect(obj.act()).toBe(obj);
  });
});
