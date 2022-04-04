import { createWritable, createComputed, configure } from '..';
import {
  onActivate,
  onUpdate,
  onDeactivate,
  onException,
  onNotifyEnd,
  onNotifyStart,
} from './lifecycle';

describe('lifecycle writables', () => {
  it('emits in right order', () => {
    const counter = createWritable(0);

    const result: any = {};
    let order = 0;

    onActivate(counter, () => {});
    onActivate(counter, () => (result.activate = ++order));
    onDeactivate(counter, () => (result.deactivate = ++order));
    onUpdate(counter, () => (result.update = ++order));
    onNotifyStart(counter, () => (result.notifyStart = ++order));
    onNotifyEnd(counter, () => (result.notifyEnd = ++order));

    const unsub = counter.subscribe(() => {});
    counter(1);
    unsub();

    expect(result.activate).toBe(1);
    expect(result.update).toBe(2);
    expect(result.notifyStart).toBe(3);
    expect(result.notifyEnd).toBe(4);
    expect(result.deactivate).toBe(5);
  });
});

describe('onActivate function', () => {
  it('subscribes the listener to the writable activate writable', () => {
    let value: any;
    let unsub: any;

    const counter = createWritable(0);
    const listener = jest.fn((v) => (value = v));

    onActivate(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);

    counter(1);
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onDeactivate function', () => {
  it('subscribes the listener to the writable deactivate writable', () => {
    let value: any;
    let unsub: any;

    const counter = createWritable(0);
    const listener = jest.fn((v) => (value = v));

    onDeactivate(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onUpdate function', () => {
  it('subscribes the listener to the writable writable update writable', () => {
    let value: any = {};
    let unsub: any;

    const counter = createWritable(0);
    const listener = jest.fn((v) => (value = v));

    onUpdate(counter, listener);
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    expect(value.value).toBe(1);
    expect(value.prevValue).toBe(0);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value.value).toBe(1);
    expect(value.prevValue).toBe(0);
    expect(listener).toBeCalledTimes(1);
  });

  it('subscribes the listener to the writable change writable', () => {
    let value: any = {};
    let unsub: any;

    const counter = createWritable(0);
    const computedCounter = createComputed(() => counter());
    const listener = jest.fn((v) => (value = v));

    onUpdate(computedCounter, listener);
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = computedCounter.subscribe(() => {});
    expect(value.value).toBeUndefined();
    expect(value.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
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
  it('subscribes the listener to the writable notifyStart writable', () => {
    let value: any;
    let unsub: any;

    const counter = createWritable(0);
    const listener = jest.fn((v) => (value = v));

    onNotifyStart(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onNotifyEnd function', () => {
  it('subscribes the listener to the writable notifyEnd writable', () => {
    let value: any;
    let unsub: any;

    const counter = createWritable(0);
    const listener = jest.fn((v) => (value = v));

    onNotifyEnd(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onException function', () => {
  it('subscribes the listener to the writable exception writable', () => {
    configure({
      logException: () => {},
    });

    let error: any;
    let unsub: any;

    const counter = createWritable(0);
    const x2Counter = createComputed(() => {
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
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(5);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(1);

    counter(6);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    counter(3);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    unsub();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    configure();
  });

  it('correctly reacts to exceptions in intermideate computed writables', () => {
    configure({
      logException: () => {},
    });

    let error: any;
    let unsub: any;

    const counter = createWritable(0);
    const x2Counter = createComputed(() => {
      if (counter() > 4) throw 'error';
      return counter() * 2;
    });
    const x4Counter = createComputed(() => x2Counter() * 2);
    const listener = jest.fn((v) => (error = v));

    onException(x4Counter, listener);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = x4Counter.subscribe(() => {});
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(2);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(5);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(1);

    counter(6);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    counter(3);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    unsub();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    configure();
  });
});
