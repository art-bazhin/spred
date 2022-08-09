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

    setCount(1);
    expect(count()).toBe(1);
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
});
