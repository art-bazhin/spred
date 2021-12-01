import { signal } from './signal';

describe('signal', () => {
  const [atom, trigger] = signal<number>();

  it('creates the pair of atom and trigger function', () => {
    expect(atom.subscribe).toBeDefined();
    expect(atom()).toBeUndefined();
    expect(trigger).toBeInstanceOf(Function);
  });

  it('passes values from the trigger function to the atom', () => {
    trigger(5);
    expect(atom()).toBe(5);

    trigger(10);
    expect(atom()).toBe(10);
  });
});
