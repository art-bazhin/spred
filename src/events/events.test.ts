import { atom, recalc } from '../main';
import { onActivate, onChange, onDeactivate } from './events';

describe('onActivate function', () => {
  it('subscribe listener to observable activation signal', () => {
    let value: any;
    let unsub: any;

    const counter = atom(0);
    const listener = jest.fn((v) => (value = v));

    onActivate(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);

    counter(1);
    recalc();
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onDeactivate function', () => {
  it('subscribe listener to observable deactivation signal', () => {
    let value: any;
    let unsub: any;

    const counter = atom(0);
    const listener = jest.fn((v) => (value = v));

    onDeactivate(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    recalc();
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onChange function', () => {
  it('subscribe listener to observable change signal', () => {
    let value: any = {};
    let unsub: any;

    const counter = atom(0);
    const listener = jest.fn((v) => (value = v));

    onChange(counter, listener);
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    recalc();
    expect(value.value).toBe(1);
    expect(value.prevValue).toBe(0);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value.value).toBe(1);
    expect(value.prevValue).toBe(0);
    expect(listener).toBeCalledTimes(1);
  });
});
