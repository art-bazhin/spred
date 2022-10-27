import { batch } from '../core/core';
import { writable } from './writable';

describe('writable', () => {
  const counter = writable(0);

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

  it('returns new value after set', () => {
    const newValue = counter(3);
    expect(newValue).toBe(3);

    const newSetValue = counter.set(3);
    expect(newSetValue).toBe(3);
  });

  it('returns current value after notify', () => {
    const value = counter.notify();
    expect(value).toBe(3);
  });

  it('updates value using update fn', () => {
    counter((value) => value + 1);
    expect(counter()).toBe(4);

    let newValue: any;

    batch(() => {
      newValue = counter((value) => value + 1);
      newValue = counter((value) => value + 1);
      newValue = counter((value) => value + 1);
      newValue = counter((value) => value + 1);
    });

    expect(counter()).toBe(8);
    expect(newValue).toBe(8);
  });

  it('updates value using update fn right after init', () => {
    const value = writable(0);

    value((v) => v + 1);
    expect(value()).toBe(1);
  });

  it('triggers subscribers if undefined value was passed', () => {
    const value = writable<any>(null);
    const spy = jest.fn();

    value.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    value(undefined);
    expect(spy).toBeCalledTimes(2);
  });

  it('has Signal methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });

  it('force emits subscribers using notify method', () => {
    const s = writable({} as any);

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.notify();

    expect(subscriber).toBeCalledTimes(2);
    expect(value).toBe(undefined);

    s().a = 1;
    s.notify();

    expect(subscriber).toBeCalledTimes(3);
    expect(value).toBe(1);

    s().a = 2;
    s.notify();

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

    a(1);
    expect(spy).toBeCalledTimes(2);

    b(1);
    expect(spy).toBeCalledTimes(4);

    b(2);
    expect(spy).toBeCalledTimes(6);
  });

  it('can have fn value', () => {
    const a = () => {};
    const b = () => {};
    const fn = writable(a);

    expect(fn()).toBe(a);

    fn(() => b);
    expect(fn()).toBe(b);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = writable(0);
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a(0);
    expect(spy).toBeCalledTimes(1);

    a(1);
    expect(spy).toBeCalledTimes(2);

    a(2);
    expect(spy).toBeCalledTimes(3);

    a(2);
    expect(spy).toBeCalledTimes(3);
  });

  it('does not ignore any new value if the second arg is true', () => {
    const a = writable(0, true);
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a(0);
    expect(spy).toBeCalledTimes(2);

    a(1);
    expect(spy).toBeCalledTimes(3);

    a(2);
    expect(spy).toBeCalledTimes(4);

    a(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('can use custom filter function', () => {
    const a = writable(0, (value) => value < 5);
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a(0);
    expect(spy).toBeCalledTimes(2);

    a(1);
    expect(spy).toBeCalledTimes(3);

    a(5);
    expect(spy).toBeCalledTimes(3);
    expect(a()).toBe(1);

    a(2);
    expect(spy).toBeCalledTimes(4);
  });
});
