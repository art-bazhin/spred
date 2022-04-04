import { createWritable, createComputed, configure } from '..';
import { createCatcher } from './catcher';

configure({
  logException: () => {},
});

describe('catcher', () => {
  it('allows to handle inactive writable exceptions', () => {
    const count = createWritable(0);

    const withError = createComputed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const handledError = createCatcher(withError, () => 42);

    expect(handledError()).toBe(42);

    count(5);
    expect(handledError()).toBe(5);

    count(4);
    expect(handledError()).toBe(42);
  });

  it('allows to handle active writable exceptions', () => {
    const count = createWritable(0);

    const withError = createComputed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const withErrorComp = createComputed(withError);
    withErrorComp.subscribe(() => {}, false);

    const handledError = createCatcher(
      () => withErrorComp(),
      () => 42
    );
    handledError.subscribe(() => {}, false);

    expect(handledError()).toBe(42);

    count(5);
    expect(handledError()).toBe(5);

    count(4);
    expect(handledError()).toBe(42);
  });

  it('allows to throw a new exception', () => {
    const count = createWritable(0);

    const withError = createComputed(() => {
      if (count() < 5) throw 5 - count();
      return count();
    });

    const withErrorComp = createComputed(withError);

    const handledError = createCatcher(withErrorComp, (e: any) => {
      if (e > 5) throw Error();
      return 42;
    });

    const secondHandledError = createCatcher(handledError, () => 999);

    handledError.subscribe(() => {}, false);

    expect(handledError()).toBe(42);
    expect(secondHandledError()).toBe(42);

    count(5);
    expect(handledError()).toBe(5);
    expect(secondHandledError()).toBe(5);

    count(4);
    expect(handledError()).toBe(42);
    expect(secondHandledError()).toBe(42);

    count(-10);
    expect(handledError()).toBe(42);
    expect(secondHandledError()).toBe(999);

    count(7);
    expect(handledError()).toBe(7);
    expect(secondHandledError()).toBe(7);
  });
});
