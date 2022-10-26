import { computed } from './computed';
import { writable } from '../writable/writable';
import { configure } from '../config/config';
import { onDeactivate } from '../lifecycle/lifecycle';

describe('computed', () => {
  const a = writable(1);
  const b = writable(2);
  const c = writable(3);
  const d = writable(4);

  const a1 = computed(() => b());
  const b1 = computed(() => a() - c());
  const c1 = computed(() => b() + d());
  const d1 = computed(() => c());

  const a2 = computed(() => b1());
  const b2 = computed(() => a1() - c1());
  const c2 = computed(() => b1() + d1());
  const d2 = computed(() => c1());

  it('is calculates value properly after creation', () => {
    expect(a2()).toBe(-2);
    expect(b2()).toBe(-4);
    expect(c2()).toBe(1);
    expect(d2()).toBe(6);
  });

  it('updates value after dependency value change', () => {
    a(4);
    b(3);
    c(2);
    d(1);

    expect(a2()).toBe(2);
    expect(b2()).toBe(-1);
    expect(c2()).toBe(4);
    expect(d2()).toBe(4);
  });

  it('has Signal methods', () => {
    expect(a.get).toBeDefined;
    expect(a.subscribe).toBeDefined;
  });

  it('can pass values to writable signals during computing', () => {
    const counter = writable(0);
    const stringCounter = writable('0');

    const x2Counter = computed(() => {
      stringCounter(counter() + '');
      return counter() * 2;
    });

    let value = '';

    stringCounter.subscribe((v) => (value = v));
    x2Counter.subscribe(() => {});

    expect(value).toBe('0');

    counter(1);
    expect(value).toBe('1');

    counter(2);
    expect(value).toBe('2');
  });

  it('logs unhandled exceptions', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = writable('bar');
    const count = computed(() => obj[field()]);

    count.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('logs unhandled exceptions in nested computeds', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = writable('bar');
    const count = computed(() => obj[field()]);

    const parent = computed(() => count());

    parent.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('unsubscribes inner subscriptions on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const ext = writable(0);

    const comp = computed(() => {
      ext.subscribe(() => spy());
      return source();
    });

    comp.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    source(2);
    expect(spy).toBeCalledTimes(3);

    ext(1);
    expect(spy).toBeCalledTimes(4);

    ext(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('unsubscribes nested inner subscriptions on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const wrap = writable(0);
    const ext = writable(0);

    const comp = computed(() => {
      wrap.subscribe(() => {
        ext.subscribe(() => spy());
      });
      return source();
    });

    comp.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    source(2);
    expect(spy).toBeCalledTimes(3);

    ext(1);
    expect(spy).toBeCalledTimes(4);

    ext(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('unsubscribes inner subscriptions in nested computeds on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const ext = writable(0);

    const comp = computed(() => {
      const wrap = computed(() => {
        ext.subscribe(() => spy());
      });

      wrap.subscribe(() => {});

      return source();
    });

    comp.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    source(2);
    expect(spy).toBeCalledTimes(3);

    ext(1);
    expect(spy).toBeCalledTimes(4);

    ext(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('handles automatic unsubscribing in the right order', () => {
    const onDeactivateSpy = jest.fn();

    const source = writable(0);
    const ext = writable(0);

    const comp = computed(() => {
      onDeactivate(ext, onDeactivateSpy);
      ext.subscribe(() => {});

      return source();
    });

    comp.subscribe(() => {});
    expect(onDeactivateSpy).toBeCalledTimes(0);

    source(1);
    expect(onDeactivateSpy).toBeCalledTimes(1);
  });

  it('handles deep nested automatic unsubscribing in the right order', () => {
    const onDeactivateSpy = jest.fn();

    const source = writable(0);
    const comp = computed(() => {
      source();
      const res = computed(() => source() * 2);
      onDeactivate(res, onDeactivateSpy);

      return res;
    });

    const parent = computed(() => {
      const res = comp();
      res.subscribe(() => {});
    });

    parent.subscribe(() => {});
    expect(onDeactivateSpy).toBeCalledTimes(0);

    source(1);
    expect(onDeactivateSpy).toBeCalledTimes(1);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = writable(0);
    const aComp = computed(() => a());
    const b = writable(0);

    aComp.subscribe(() => {
      b.subscribe(() => spy());
    });

    expect(spy).toBeCalledTimes(1);

    a(1);
    expect(spy).toBeCalledTimes(2);

    b(1);
    expect(spy).toBeCalledTimes(4);

    b(2);
    expect(spy).toBeCalledTimes(6);
  });

  it('keeps subscriptions made inside a deep nested subscriber', () => {
    const spy = jest.fn();
    const a = writable(0);
    const aComp = computed(() => a());
    const b = writable(0);

    const wrap = computed(() => {
      aComp.subscribe(() => {
        b.subscribe(() => spy());
      });
    });

    wrap();

    expect(spy).toBeCalledTimes(1);

    a(1);
    expect(spy).toBeCalledTimes(2);

    b(1);
    expect(spy).toBeCalledTimes(4);

    b(2);
    expect(spy).toBeCalledTimes(6);
  });

  it('passes previous value into compute fn as first argument', () => {
    let prev: any;

    const source = writable(0);
    const result = computed((prevValue: number | undefined) => {
      prev = prevValue;
      return source();
    });

    result.subscribe(() => {});

    expect(prev).toBeUndefined();

    source(1);
    expect(prev).toBe(0);

    source(2);
    expect(prev).toBe(1);
  });

  it('passes true as second compute fn argument if computation was scheduled', () => {
    let lastScheduled: boolean | undefined;

    const spy = jest.fn();

    const source = writable(0);
    const result = computed((_: any, scheduled?: boolean) => {
      lastScheduled = scheduled;
      spy();
      return source();
    });

    const unsub = result.subscribe(() => {});

    expect(lastScheduled).toBeFalsy();
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(lastScheduled).toBe(true);
    expect(spy).toBeCalledTimes(2);

    source(2);
    expect(lastScheduled).toBe(true);
    expect(spy).toBeCalledTimes(3);

    unsub();
    result();
    expect(spy).toBeCalledTimes(3);

    source(3);
    result();
    expect(lastScheduled).toBeFalsy();
    expect(spy).toBeCalledTimes(4);
  });

  it('does not recalculates if became inactive during previous calculations', () => {
    const spy = jest.fn();

    const source = writable(0);
    let unsub: any;

    const a = computed(() => {
      const v = source();

      if (v > 10 && unsub) unsub();
      return v;
    });

    a.subscribe(() => {});

    const b = computed(() => {
      spy();
      return source();
    });

    const c = computed(() => b());

    unsub = c.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    source(11);
    expect(spy).toBeCalledTimes(2);
  });

  it('does not trigger dependants until its value is changed by default', () => {
    const counter = writable(0);
    const x2Counter = computed(() => counter() * 2);
    const spy = jest.fn();

    x2Counter.subscribe(spy, false);

    expect(counter()).toBe(0);
    expect(x2Counter()).toBe(0);
    expect(spy).toBeCalledTimes(0);

    counter(0);
    expect(counter()).toBe(0);
    expect(x2Counter()).toBe(0);
    expect(spy).toBeCalledTimes(0);

    counter(1);
    expect(counter()).toBe(1);
    expect(x2Counter()).toBe(2);
    expect(spy).toBeCalledTimes(1);

    counter(2);
    expect(counter()).toBe(2);
    expect(x2Counter()).toBe(4);
    expect(spy).toBeCalledTimes(2);

    counter(2);
    expect(counter()).toBe(2);
    expect(x2Counter()).toBe(4);
    expect(spy).toBeCalledTimes(2);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = writable(0, false);
    const b = computed(a);
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a(0);
    expect(spy).toBeCalledTimes(1);

    a(1);
    expect(spy).toBeCalledTimes(2);

    a(2);
    expect(spy).toBeCalledTimes(3);

    a(2);
    expect(spy).toBeCalledTimes(3);
  });

  it('does not ignore any new value if the second arg is true', () => {
    const a = writable(0, true);
    const b = computed(a, true);
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a(0);
    expect(spy).toBeCalledTimes(2);

    a(1);
    expect(spy).toBeCalledTimes(3);

    a(2);
    expect(spy).toBeCalledTimes(4);

    a(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('can use custom filter function', () => {
    const a = writable(0, true);
    const b = computed(a, (value) => value < 5);
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a(0);
    expect(spy).toBeCalledTimes(2);

    a(1);
    expect(spy).toBeCalledTimes(3);

    a(5);
    expect(spy).toBeCalledTimes(3);

    a(2);
    expect(spy).toBeCalledTimes(4);
  });

  it('allows to handle inactive signal exceptions', () => {
    const count = writable(0);

    const withError = computed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const handledError = computed(withError, null, () => 42);

    expect(handledError()).toBe(42);

    count(5);
    expect(handledError()).toBe(5);

    count(4);
    expect(handledError()).toBe(42);
  });

  it('allows to handle active signal exceptions', () => {
    const errorSpy = jest.fn();

    configure({
      logException: errorSpy,
    });

    const count = writable(0);

    const withError = computed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const withErrorComp = computed(withError);
    const unsub1 = withErrorComp.subscribe(() => {}, false);

    expect(errorSpy).toBeCalledTimes(1);

    const handledError = computed(withErrorComp, null, () => 42);
    const unsub2 = handledError.subscribe(() => {}, false);

    expect(handledError()).toBe(42);

    count(5);
    expect(handledError()).toBe(5);

    count(4);
    expect(handledError()).toBe(42);
    expect(errorSpy).toBeCalledTimes(2); // check logging on middle computed with subs and dependants

    unsub2();
    count(2);
    expect(errorSpy).toBeCalledTimes(3); // check logging on middle computed with subs only

    unsub1();
    handledError.subscribe(() => {}, false);
    count(1);
    expect(errorSpy).toBeCalledTimes(3);
  });

  it('allows to throw a new exception', () => {
    const count = writable(0);

    const handledError = computed(
      () => {
        if (count() < 5) throw 5 - count();
        return count();
      },
      null,
      (e: any) => {
        if (e > 5) throw Error();
        return 42;
      }
    );

    const secondHandledError = computed(handledError, null, () => 999);

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
