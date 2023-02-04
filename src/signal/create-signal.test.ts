import { isSignal, isWritableSignal } from '../guards/guards';
import { on } from '../on/on';
import { signal } from './create-signal';

describe('signal function', () => {
  it('creates a tuple of readonly signal and setter function', () => {
    const [count, setCount] = signal(0);

    expect(isSignal(count)).toBeTruthy();
    expect(isWritableSignal(count)).toBeFalsy;
    expect(typeof setCount).toBe('function');
    expect(count()).toBe(0);

    let v1 = setCount(1);
    expect(count()).toBe(1);
    expect(v1).toBe(1);

    let v2 = setCount((v) => v + 1);
    expect(count()).toBe(2);
    expect(v2).toBe(2);
  });

  it('emits unique value each time setter called without arguments', () => {
    const [event, emitEvent] = signal();
    const array: any[] = [];

    on(event, (payload) => array.push(payload));

    emitEvent();
    emitEvent();
    emitEvent();
    emitEvent();
    emitEvent();

    expect(array.length).toBe(5);
    expect(array.length).toBe(new Set(array).size);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const [value, set] = signal(0);
    const spy = jest.fn();

    value.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    set(0);
    expect(spy).toBeCalledTimes(1);

    set(1);
    expect(spy).toBeCalledTimes(2);

    set(2);
    expect(spy).toBeCalledTimes(3);

    set(2);
    expect(spy).toBeCalledTimes(3);
  });

  it('does not ignore any new value if the second arg returns false', () => {
    const [value, set] = signal(0, () => false);
    const spy = jest.fn();

    value.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    set(0);
    expect(spy).toBeCalledTimes(2);

    set(1);
    expect(spy).toBeCalledTimes(3);

    set(2);
    expect(spy).toBeCalledTimes(4);

    set(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('can use custom compare function', () => {
    const [value, set] = signal(0, (value) => value >= 5);
    const spy = jest.fn();

    value.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    set(0);
    expect(spy).toBeCalledTimes(2);

    set(1);
    expect(spy).toBeCalledTimes(3);

    set(5);
    expect(spy).toBeCalledTimes(3);

    set(2);
    expect(spy).toBeCalledTimes(4);
  });
});
