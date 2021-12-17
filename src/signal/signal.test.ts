import { on } from '../on/on';
import { signal } from './signal';

describe('signal function', () => {
  const [event, emitEvent] = signal<string>();
  let str = '';

  it('creates emit function', () => {
    expect(emitEvent).toBeInstanceOf(Function);
  });

  it('synchroniously exec listeners on every emit function call', () => {
    on(event, (v) => (str += v));

    emitEvent('1');
    emitEvent('2');
    emitEvent('3');

    expect(str).toBe('123');
  });
});

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

// describe('signal', () => {
//   describe('map method', () => {
//     const [setCountSignal, setCount] = signal();

//     it('exists', () => {});
//   });
// });
