import { signal } from './signal';

describe('writable signal', () => {
  const counter = signal(0);

  it('is created with default value', () => {
    expect(counter()).toBe(0);
  });

  it('updates value', () => {
    counter(1);
    expect(counter()).toBe(1);
  });

  it('updates value using set method', () => {
    counter.set(2);
    expect(counter()).toBe(2);
  });

  it('has Signal methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });

  it('force emits subscribers using notify method', () => {
    const atom = signal({} as any);

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    atom.subscribe(subscriber);

    atom.notify();

    expect(subscriber).toBeCalledTimes(2);
    expect(value).toBe(undefined);

    atom().a = 1;
    atom.notify();

    expect(subscriber).toBeCalledTimes(3);
    expect(value).toBe(1);

    atom().a = 2;
    atom.notify();

    expect(subscriber).toBeCalledTimes(4);
    expect(value).toBe(2);
  });
});
