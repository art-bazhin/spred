import { writable, recalc, computed, configure } from '../main';
import {
  onActivate,
  onChange,
  onDeactivate,
  onException,
  onNotifyEnd,
  onNotifyStart,
} from './lifecycle';

describe('onActivate function', () => {
  it('subscribes the listener to the atom activate signal', () => {
    let value: any;
    let unsub: any;

    const counter = writable(0);
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
  it('subscribes the listener to the atom deactivate signal', () => {
    let value: any;
    let unsub: any;

    const counter = writable(0);
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
  it('subscribes the listener to the writable atom change signal', () => {
    let value: any = {};
    let unsub: any;

    const counter = writable(0);
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

  it('subscribes the listener to the atom change signal', () => {
    let value: any = {};
    let unsub: any;

    const counter = writable(0);
    const computedCounter = computed(() => counter());
    const listener = jest.fn((v) => (value = v));

    onChange(computedCounter, listener);
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = computedCounter.subscribe(() => {});
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

describe('onNotifyStart function', () => {
  it('subscribes the listener to the atom notifyStart signal', () => {
    let value: any;
    let unsub: any;

    const counter = writable(0);
    const listener = jest.fn((v) => (value = v));

    onNotifyStart(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    recalc();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onNotifyEnd function', () => {
  it('subscribes the listener to the atom notifyEnd signal', () => {
    let value: any;
    let unsub: any;

    const counter = writable(0);
    const listener = jest.fn((v) => (value = v));

    onNotifyEnd(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    recalc();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onException function', () => {
  it('subscribes the listener to the atom exception signal', () => {
    configure({
      logException: () => {},
    });

    let error: any;
    let unsub: any;

    const counter = writable(0);
    const x2Counter = computed(() => {
      if (counter() > 4) throw 'error';
      return counter() * 2;
    });
    const listener = jest.fn((v) => (error = v));

    onException(x2Counter, listener);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = x2Counter.subscribe(() => {});
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(2);
    recalc();
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(5);
    recalc();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(1);

    counter(6);
    recalc();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    counter(3);
    recalc();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    unsub();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    configure();
  });

  it('correctly reacts to exceptions in intermideate computed atoms', () => {
    configure({
      logException: () => {},
    });

    let error: any;
    let unsub: any;

    const counter = writable(0);
    const x2Counter = computed(() => {
      if (counter() > 4) throw 'error';
      return counter() * 2;
    });
    const x4Counter = computed(() => x2Counter() * 2);
    const listener = jest.fn((v) => (error = v));

    onException(x4Counter, listener);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = x4Counter.subscribe(() => {});
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(2);
    recalc();
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(5);
    recalc();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(1);

    counter(6);
    recalc();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    counter(3);
    recalc();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    unsub();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    configure();
  });
});
