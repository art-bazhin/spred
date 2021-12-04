import { on } from '../on/on';
import { signal } from './signal';

describe('signal', () => {
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
