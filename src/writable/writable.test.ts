import { batch } from '../core/core';
import {
  onActivate,
  onDeactivate,
  onNotifyEnd,
  onNotifyStart,
  onUpdate,
} from '../lifecycle/lifecycle';
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

  it('updates value using update method', () => {
    counter.update((value) => value + 1);
    expect(counter()).toBe(4);

    let newValue: any;

    batch(() => {
      newValue = counter.update((value) => value + 1);
      newValue = counter.update((value) => value + 1);
      newValue = counter.update((value) => value + 1);
      newValue = counter.update((value) => value + 1);
    });

    expect(counter()).toBe(8);
    expect(newValue).toBe(8);
  });

  it('updates value using update method right after init', () => {
    const value = writable(0);

    value.update((v) => v + 1);
    expect(value()).toBe(1);
  });

  it('does not trigger subscribers if undefined value was passed', () => {
    const value = writable<any>();
    const spy = jest.fn();

    value.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    value(undefined);
    expect(spy).toBeCalledTimes(1);
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

  it('does not update the value when undefined passed', () => {
    const counter = writable<any>(0);

    expect(counter()).toBe(0);

    counter(undefined);
    expect(counter()).toBe(0);
  });

  it('can have fn value', () => {
    const a = () => {};
    const b = () => {};
    const fn = writable(a);

    expect(fn()).toBe(a);

    fn(b);
    expect(fn()).toBe(b);
  });
});
