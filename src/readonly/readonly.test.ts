import { signal } from '../signal/signal';
import { readonly } from './readonly';

describe('readonly function', () => {
  it('creates a readonly copy of the writable atom', () => {
    const counter = signal(0);
    const readonlyCounter = readonly(counter);

    (readonlyCounter as any)(5);

    expect(readonlyCounter()).toBe(counter());
    expect(readonlyCounter()).toBe(0);
    expect((readonlyCounter as any).set).toBeUndefined();
  });
});
