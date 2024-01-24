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

  it('returns void after set', () => {
    const newValue = counter.set(3);
    expect(newValue).toBeUndefined();
  });

  it('returns void value after notifiing', () => {
    const value = counter.update();
    expect(value).toBeUndefined();
  });

  it('updates value using update fn', () => {
    counter.update((value) => value + 1);
    expect(counter.get()).toBe(4);

    batch(() => {
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
    });

    expect(counter.get()).toBe(8);
  });

  it('updates value using update fn right after init', () => {
    const value = writable(0);

    value.update((v) => v + 1);
    expect(value.get()).toBe(1);
  });

  it('has Signal methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });

  it('force emits subscribers using update method with a function that returns void', () => {
    interface Test {
      a?: number;
    }
    const s = writable({} as Test);

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.update();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(undefined);

    s.update((value) => {
      value.a = 1;
    });

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.update((value) => {
      value.a = 2;
    });

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.get());

    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('force emits subscribers using update method without arguments', () => {
    const s = writable({} as any);

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.update();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(undefined);

    s.get().a = 1;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.get().a = 2;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.get());

    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('force emits dependent subscribers using update method without arguments', () => {
    const obj = { shit: 'yeah' } as any;
    const s = writable(obj);
    const comp = computed(() => s.get().a || null, {
      equal: () => false,
    });

    let value: any;

    const subscriber = jest.fn((v: any) => {
      value = v;
    });

    comp.subscribe(subscriber);

    s.update();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(null);

    s.get().a = 1;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.get().a = 2;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(obj);

    expect(value).toBe(2);
    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = writable(0);
    const b = writable(0);

    a.subscribe(() => {
      b.subscribe(() => spy());
    });

    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    b.set(2);
    expect(spy).toHaveBeenCalledTimes(6);
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
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not ignore any new value if the second arg returns false', () => {
    const a = writable(0, {
      equal: () => false,
    });
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('can use custom equals function', () => {
    const a = writable(0, {
      equal(value) {
        return value >= 5;
      },
    });

    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(5);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(a.get()).toBe(1);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });
});
