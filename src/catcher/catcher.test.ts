import { writable, computed, configure } from '..';
import { catcher } from './catcher';

configure({
  logException: () => {},
});

describe('catcher', () => {
  it('allows to handle inactive writable exceptions', () => {
    const count = writable(0);

    const withError = computed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const handledError = catcher(withError, () => 42);

    expect(handledError()).toBe(42);

    count(5);
    expect(handledError()).toBe(5);

    count(4);
    expect(handledError()).toBe(42);
  });

  it('allows to handle active writable exceptions', () => {
    const count = writable(0);

    const withError = computed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const withErrorComp = computed(withError);
    withErrorComp.subscribe(() => {}, false);

    const handledError = catcher(
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
    const count = writable(0);

    const withError = computed(() => {
      if (count() < 5) throw 5 - count();
      return count();
    });

    const withErrorComp = computed(withError);

    const handledError = catcher(withErrorComp, (e: any) => {
      if (e > 5) throw Error();
      return 42;
    });

    const secondHandledError = catcher(handledError, () => 999);

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
