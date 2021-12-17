import { on } from '../on/on';
import { signal } from './signal';

describe('signal function', () => {
  const [event, emitEvent] = signal<string>();
  let str = '';
  let unsub: any;
  let listener = (v: any) => (str += v);

  it('creates emit function', () => {
    expect(emitEvent).toBeInstanceOf(Function);
  });

  it('synchroniously exec listeners on every emit function call', () => {
    unsub = on(event, listener);

    emitEvent('1');
    emitEvent('2');
    emitEvent('3');

    expect(str).toBe('123');
  });

  it('does not subscribe same listener multiple times', () => {
    on(event, listener);

    emitEvent('4');

    expect(str).toBe('1234');
  });

  it('stops to trigger listeners after unsubscribing', () => {
    unsub();

    emitEvent('1');

    expect(str).toBe('1234');
  });
});

describe('signal', () => {
  describe('signal without payload', () => {
    it('is emited without payload', () => {
      const [s, emit] = signal();
      const listener = jest.fn();

      on(s, listener);

      emit();
      emit();
      emit();

      expect(listener).toBeCalledTimes(3);
    });
  });

  describe('map method', () => {
    const [setCountSignal, setCount] = signal<number>();

    it('exists', () => {
      expect(setCountSignal.map).toBeInstanceOf(Function);
    });

    it('creates a mapped signal', () => {
      let value = 0;
      let listener = jest.fn((v: number) => (value = v));

      const mappedSignal = setCountSignal.map((value) => value * 2);

      expect(mappedSignal).toBeDefined();

      on(mappedSignal, listener);

      setCount(1);
      expect(value).toBe(2);

      setCount(2);
      expect(value).toBe(4);

      expect(listener).toBeCalledTimes(2);
    });
  });

  describe('mapped signal', () => {
    const [setCountSignal, setCount] = signal<number>();
    const gt10Signal = setCountSignal.map((payload) => {
      if (payload > 10) return payload;
    });

    let listener = jest.fn();

    const unsub = on(gt10Signal, listener);

    it('filters undefined payloads', () => {
      setCount(1);
      setCount(11);
      setCount(6);
      setCount(15);
      setCount(15);

      expect(listener).toBeCalledTimes(3);
    });

    it('stops to trigger listeners after unsubscribing', () => {
      unsub();

      setCount(20);
      expect(listener).toBeCalledTimes(3);
    });
  });
});
