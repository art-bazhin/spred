import { signal } from './signal';

describe('signal function', () => {
  const [event, emitEvent] = signal<string>();
  let str = '';
  let unsub: any;
  let listener = (v: any) => (str += v);

  it('creates emit function', () => {
    expect(emitEvent).toBeInstanceOf(Function);
  });
});
