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

  it('keeps lifecycle subscriptions made inside a subscriber', () => {
    const a = writable(0);

    const onActivateSpy = jest.fn();
    const onDeactivateSpy = jest.fn();
    const onUpdateSpy = jest.fn();
    const onNotifyStartSpy = jest.fn();
    const onNotifyEndSpy = jest.fn();

    const ext = writable(0);

    a.subscribe(() => {
      onActivate(ext, () => onActivateSpy());
      onDeactivate(ext, () => onDeactivateSpy());
      onUpdate(ext, () => onUpdateSpy());
      onNotifyStart(ext, () => onNotifyStartSpy());
      onNotifyEnd(ext, () => onNotifyEndSpy());
    });

    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    a(1);
    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    const extUnsub = ext.subscribe(() => {});
    expect(onActivateSpy).toBeCalledTimes(2);

    ext(1);
    expect(onUpdateSpy).toBeCalledTimes(2);
    expect(onNotifyStartSpy).toBeCalledTimes(2);
    expect(onNotifyEndSpy).toBeCalledTimes(2);

    extUnsub();
    expect(onDeactivateSpy).toBeCalledTimes(2);
  });

  it('does not update the value when undefined passed', () => {
    const counter = writable<any>(0);

    expect(counter()).toBe(0);

    counter(undefined);
    expect(counter()).toBe(0);
  });
});
