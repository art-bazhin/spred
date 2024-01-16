import { computed } from './computed';
import { writable } from '../writable/writable';
import { configure } from '../config/config';
import { batch } from '../core/core';
import { VOID } from '../utils/constants';

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
    a.set(4);
    b.set(3);
    c.set(2);
    d.set(1);

    expect(a2()).toBe(2);
    expect(b2()).toBe(-1);
    expect(c2()).toBe(4);
    expect(d2()).toBe(4);
  });

  it('updates value properly using batching', () => {
    batch(() => {
      a.set(1);
      b.set(2);
      c.set(3);
      d.set(4);
    });

    expect(a2()).toBe(-2);
    expect(b2()).toBe(-4);
    expect(c2()).toBe(1);
    expect(d2()).toBe(6);
  });

  it('updates value properly on subscribers run', () => {
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

    let aSub,
      bSub,
      cSub,
      dSub = 0;

    a2.subscribe((v) => (aSub = v));
    b2.subscribe((v) => (bSub = v));
    c2.subscribe((v) => (cSub = v));
    d2.subscribe((v) => (dSub = v));

    batch(() => {
      a.set(4);
      b.set(3);
      c.set(2);
      d.set(1);
    });

    expect(aSub).toBe(2);
    expect(bSub).toBe(-1);
    expect(cSub).toBe(4);
    expect(dSub).toBe(4);
  });

  it('has Signal methods', () => {
    expect(a.get).toBeDefined;
    expect(a.subscribe).toBeDefined;
  });

  it('can pass values to writable signals during computing', () => {
    const counter = writable(0);
    const stringCounter = writable('0');

    const x2Counter = computed(() => {
      stringCounter.set(counter() + '');
      return counter() * 2;
    });

    let value = '';

    stringCounter.subscribe((v) => (value = v));
    x2Counter.subscribe(() => {});

    expect(value).toBe('0');

    counter.set(1);
    expect(value).toBe('1');

    counter.set(2);
    expect(value).toBe('2');
  });

  it('can pass values to writable signals during computing (case 2)', () => {
    const a = writable(0);
    const b = writable(0);
    const c = computed(() => {
      if (a() > 5) b.set(10);
      return a() + b();
    });

    c.subscribe(() => {});
    expect(c()).toBe(0);

    a.set(1);
    expect(c()).toBe(1);

    a.set(6);
    expect(c()).toBe(16);

    b.set(5);
    expect(c()).toBe(16);
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

    source.set(1);
    expect(spy).toBeCalledTimes(2);

    source.set(2);
    expect(spy).toBeCalledTimes(3);

    ext.set(1);
    expect(spy).toBeCalledTimes(4);

    ext.set(2);
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

    source.set(1);
    expect(spy).toBeCalledTimes(2);

    source.set(2);
    expect(spy).toBeCalledTimes(3);

    ext.set(1);
    expect(spy).toBeCalledTimes(4);

    ext.set(2);
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

    source.set(1);
    expect(spy).toBeCalledTimes(2);

    source.set(2);
    expect(spy).toBeCalledTimes(3);

    ext.set(1);
    expect(spy).toBeCalledTimes(4);

    ext.set(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('unsubscribes all inner subscriptions on parent calculation', () => {
    const innerSpy = jest.fn();
    const externalSpy = jest.fn();
    const deepSpy = jest.fn();

    const source = writable(0);
    const external = writable(0);

    const comp = computed(() => {
      const inner = computed(() => {
        const deep = computed(external);
        deep.subscribe(() => deepSpy());

        return external();
      });

      external.subscribe(() => externalSpy());
      inner.subscribe(() => innerSpy());

      return source();
    });

    comp.subscribe(() => {});
    expect(innerSpy).toBeCalledTimes(1);
    expect(externalSpy).toBeCalledTimes(1);
    expect(deepSpy).toBeCalledTimes(1);

    source.set(1);
    expect(innerSpy).toBeCalledTimes(2);
    expect(externalSpy).toBeCalledTimes(2);
    expect(deepSpy).toBeCalledTimes(2);

    source.set(2);
    expect(innerSpy).toBeCalledTimes(3);
    expect(externalSpy).toBeCalledTimes(3);
    expect(deepSpy).toBeCalledTimes(3);

    external.set(1);
    expect(innerSpy).toBeCalledTimes(4);
    expect(externalSpy).toBeCalledTimes(4);
    expect(deepSpy).toBeCalledTimes(5); // because of subscription order

    external.set(2);
    expect(innerSpy).toBeCalledTimes(5);
    expect(externalSpy).toBeCalledTimes(5);
    expect(deepSpy).toBeCalledTimes(6);

    external.set(3);
    expect(innerSpy).toBeCalledTimes(6);
    expect(externalSpy).toBeCalledTimes(6);
    expect(deepSpy).toBeCalledTimes(7);
  });

  it('handles automatic unsubscribing in the right order', () => {
    const onDeactivateSpy = jest.fn();

    const source = writable(0);
    const ext = writable(0, {
      onDeactivate: () => onDeactivateSpy(),
    });

    const comp = computed(() => {
      ext.subscribe(() => {});
      return source();
    });

    comp.subscribe(() => {});
    expect(onDeactivateSpy).toBeCalledTimes(0);

    source.set(1);
    expect(onDeactivateSpy).toBeCalledTimes(1);
  });

  it('handles deep nested automatic unsubscribing in the right order', () => {
    const onDeactivateSpy = jest.fn();

    const source = writable(0);
    const comp = computed(() => {
      source();

      const res = computed(() => source() * 2, {
        onDeactivate: () => onDeactivateSpy(),
      });

      return res;
    });

    const parent = computed(() => {
      const res = comp();
      res.subscribe(() => {});
    });

    parent.subscribe(() => {});
    expect(onDeactivateSpy).toBeCalledTimes(0);

    source.set(1);
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

    a.set(1);
    expect(spy).toBeCalledTimes(2);

    b.set(1);
    expect(spy).toBeCalledTimes(4);

    b.set(2);
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

    a.set(1);
    expect(spy).toBeCalledTimes(2);

    b.set(1);
    expect(spy).toBeCalledTimes(4);

    b.set(2);
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

    source.set(1);
    expect(prev).toBe(0);

    source.set(2);
    expect(prev).toBe(1);
  });

  it('passes true as second compute fn argument if computation was scheduled', () => {
    let lastScheduled = false;
    let lastMedScheduled = false;

    const spy = jest.fn();
    const medSpy = jest.fn();

    const source = writable(0);

    const med = computed((_: any, scheduled: boolean) => {
      lastMedScheduled = scheduled;
      medSpy();
      return source() * 2;
    });

    const result = computed((_: any, scheduled: boolean) => {
      lastScheduled = scheduled;
      spy();
      return source() < 5 ? source() : med();
    });

    let unsub = result.subscribe(() => {});

    expect(lastScheduled).toBe(false);
    expect(spy).toBeCalledTimes(1);

    source.set(1);
    expect(lastScheduled).toBe(true);
    expect(spy).toBeCalledTimes(2);

    source.set(2);
    expect(lastScheduled).toBe(true);
    expect(spy).toBeCalledTimes(3);

    unsub();
    result();
    expect(spy).toBeCalledTimes(3);

    source.set(3);
    result();
    expect(lastScheduled).toBe(false);
    expect(spy).toBeCalledTimes(4);

    unsub = result.subscribe(() => {});
    expect(lastScheduled).toBe(false);
    expect(spy).toBeCalledTimes(4);

    source.set(10);
    expect(lastScheduled).toBe(true);
    expect(lastMedScheduled).toBe(false);
    expect(medSpy).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(5);

    source.set(11);
    expect(lastScheduled).toBe(true);
    expect(lastMedScheduled).toBe(true);
    expect(medSpy).toBeCalledTimes(2);
    expect(spy).toBeCalledTimes(6);

    source.set(4);
    expect(lastScheduled).toBe(true);
    expect(lastMedScheduled).toBe(true);
    expect(medSpy).toBeCalledTimes(2);
    expect(spy).toBeCalledTimes(7);

    med();
    expect(lastMedScheduled).toBe(false);
  });

  it('passes true as second compute fn argument if computation was scheduled (case 2)', () => {
    let lastScheduled: boolean | undefined;

    const spy = jest.fn();

    const a = writable(0);
    const b = writable(0);

    const c = computed((_: any, scheduled?: boolean) => {
      lastScheduled = scheduled;
      spy();
      return a();
    });

    const d = computed(() => {
      if (b()) c.subscribe(() => {});
      return b();
    });

    d.subscribe(() => {});
    expect(lastScheduled).toBeFalsy();

    b.set(1);
    expect(lastScheduled).toBeFalsy();
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

    source.set(1);
    expect(spy).toBeCalledTimes(2);

    source.set(11);
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

    counter.set(0);
    expect(counter()).toBe(0);
    expect(x2Counter()).toBe(0);
    expect(spy).toBeCalledTimes(0);

    counter.set(1);
    expect(counter()).toBe(1);
    expect(x2Counter()).toBe(2);
    expect(spy).toBeCalledTimes(1);

    counter.set(2);
    expect(counter()).toBe(2);
    expect(x2Counter()).toBe(4);
    expect(spy).toBeCalledTimes(2);

    counter.set(2);
    expect(counter()).toBe(2);
    expect(x2Counter()).toBe(4);
    expect(spy).toBeCalledTimes(2);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = writable(0);
    const b = computed(a);
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(1);

    a.set(1);
    expect(spy).toBeCalledTimes(2);

    a.set(2);
    expect(spy).toBeCalledTimes(3);

    a.set(2);
    expect(spy).toBeCalledTimes(3);
  });

  it('does not ignore any new value if the second arg returns true', () => {
    const a = writable(0, {
      equals: () => false,
    });
    const b = computed(a, {
      equals: () => false,
    });
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(2);

    a.set(1);
    expect(spy).toBeCalledTimes(3);

    a.set(2);
    expect(spy).toBeCalledTimes(4);

    a.set(2);
    expect(spy).toBeCalledTimes(5);
  });

  it('can use custom compare function', () => {
    const a = writable(0, {
      equals: () => false,
    });
    const b = computed(a, {
      equals: (value) => value >= 5,
    });
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(2);

    a.set(1);
    expect(spy).toBeCalledTimes(3);

    a.set(5);
    expect(spy).toBeCalledTimes(3);

    a.set(2);
    expect(spy).toBeCalledTimes(4);
  });

  it('can filter values using VOID constant', () => {
    const a = writable(0, {
      equals: () => false,
    });
    const b = computed(
      () => {
        const value = a();

        if (value >= 5) return VOID;
        return value;
      },
      {
        equals: () => false,
      },
    );
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    a.set(0);
    expect(spy).toBeCalledTimes(2);

    a.set(1);
    expect(spy).toBeCalledTimes(3);

    a.set(5);
    expect(spy).toBeCalledTimes(3);

    a.set(2);
    expect(spy).toBeCalledTimes(4);
  });

  it('allows to handle inactive signal exceptions', () => {
    const count = writable(0);

    const withError = computed(() => {
      if (count() < 5) throw Error();
      return count();
    });

    const handledError = computed(withError, {
      catch: () => 42,
    });

    expect(handledError()).toBe(42);

    count.set(5);
    expect(handledError()).toBe(5);

    count.set(4);
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

    const handledError = computed(withErrorComp, {
      catch: () => 42,
    });
    const unsub2 = handledError.subscribe(() => {}, false);

    expect(handledError()).toBe(42);

    count.set(5);
    expect(handledError()).toBe(5);

    count.set(4);
    expect(handledError()).toBe(42);
    expect(errorSpy).toBeCalledTimes(2); // check logging on middle computed with subs and dependants

    unsub2();
    count.set(2);
    expect(errorSpy).toBeCalledTimes(3); // check logging on middle computed with subs only

    unsub1();
    handledError.subscribe(() => {}, false);
    count.set(1);
    expect(errorSpy).toBeCalledTimes(3);
  });

  it('allows to throw a new exception', () => {
    const count = writable(0);

    const handledError = computed(
      () => {
        if (count() < 5) throw 5 - count();
        return count();
      },
      {
        catch: (e: any) => {
          if (e > 5) throw Error();
          return 42;
        },
      },
    );

    const secondHandledError = computed(handledError, {
      catch: () => 999,
    });

    handledError.subscribe(() => {}, false);

    expect(handledError()).toBe(42);
    expect(secondHandledError()).toBe(42);

    count.set(5);
    expect(handledError()).toBe(5);
    expect(secondHandledError()).toBe(5);

    count.set(4);
    expect(handledError()).toBe(42);
    expect(secondHandledError()).toBe(42);

    count.set(-10);
    expect(handledError()).toBe(42);
    expect(secondHandledError()).toBe(999);

    count.set(7);
    expect(handledError()).toBe(7);
    expect(secondHandledError()).toBe(7);
  });
});
