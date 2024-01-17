import { computed } from '../computed/computed';
import { writable } from './writable';
import { batch } from '../core/core';

describe('writable', () => {
  const counter = writable(0);

  it('is created with default value', () => {
    expect(counter.get()).toBe(0);
  });

  it('updates value', () => {
    counter.set(1);
    expect(counter.get()).toBe(1);
  });

  it('updates value using set method', () => {
    counter.set(2);
    expect(counter.get()).toBe(2);
  });

  it('returns new value after set', () => {
    const newValue = counter.set(3);
    expect(newValue).toBe(3);

    const newSetValue = counter.set(3);
    expect(newSetValue).toBe(3);
  });

  it('returns current value after notify', () => {
    const value = counter.set();
    expect(value).toBe(3);
  });

  it('updates value using update fn', () => {
    counter.update((value) => value + 1);
    expect(counter.get()).toBe(4);

    let newValue: any;

    batch(() => {
      newValue = counter.update((value) => value + 1);
      newValue = counter.update((value) => value + 1);
      newValue = counter.update((value) => value + 1);
      newValue = counter.update((value) => value + 1);
    });

    expect(counter.get()).toBe(8);
    expect(newValue).toBe(8);
  });

  it('updates value using update fn right after init', () => {
    const value = writable(0);

    value.update((v) => v + 1);
    expect(value.get()).toBe(1);
  });

  it('triggers subscribers if undefined value was passed', () => {
    const value = writable<any>(null);
    const spy = jest.fn();

    value.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    value.set(undefined);
    expect(spy).toBeCalledTimes(2);
  });

  it('has Signal methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });

  it('force emits subscribers using set method without arguments', () => {
    const s = writable({} as any);

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.set();

    expect(subscriber).toBeCalledTimes(2);
    expect(value).toBe(undefined);

    s.get().a = 1;
    s.set();

    expect(subscriber).toBeCalledTimes(3);
    expect(value).toBe(1);

    s.get().a = 2;
    s.set();

    expect(subscriber).toBeCalledTimes(4);
    expect(value).toBe(2);
  });

  it('force emits dependant subscribers using notify method', () => {
    const s = writable({} as any);
    const comp = computed(() => s.get().a, {
      equals: () => false,
    });

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v));

    comp.subscribe(subscriber);

    s.set();

    expect(subscriber).toBeCalledTimes(2);
    expect(value).toBe(undefined);

    s.get().a = 1;
    s.set();

    expect(subscriber).toBeCalledTimes(3);
    expect(value).toBe(1);

    s.get().a = 2;
    s.set();

    expect(subscriber).toBeCalledTimes(4);
    expect(value).toBe(2);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = writable(0);
    const b = writable(0);

    a.subscribe(() => {
      b.subscribe(() => spy());
    });

    expect(spy).toBeCalledTimes(1);

    a.set(1);
    expect(spy).toBeCalledTimes(2);

    b.set(1);
    expect(spy).toBeCalledTimes(4);

    b.set(2);
    expect(spy).toBeCalledTimes(6);
  });

  it('can have fn value', () => {
    const a = () => {};
    const b = () => {};
    const fn = writable(a);

    expect(fn.get()).toBe(a);

    fn.set(b);
    expect(fn.get()).toBe(b);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = writable(0);
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(1);

    a.set(1);
    expect(spy).toBeCalledTimes(2);

    a.set(2);
    expect(spy).toBeCalledTimes(3);

    a.set(2);
    expect(spy).toBeCalledTimes(3);
  });

  it('does not ignore any new value if the second arg returns false', () => {
    const a = writable(0, {
      equals: () => false,
    });
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(2);

    a.set(1);
    expect(spy).toBeCalledTimes(3);

    a.set(2);
    expect(spy).toBeCalledTimes(4);

    a.set(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('can use custom equals function', () => {
    const a = writable(0, {
      equals(value) {
        return value >= 5;
      },
    });

    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(2);

    a.set(1);
    expect(spy).toBeCalledTimes(3);

    a.set(5);
    expect(spy).toBeCalledTimes(3);
    expect(a.get()).toBe(1);

    a.set(2);
    expect(spy).toBeCalledTimes(4);
  });
});
