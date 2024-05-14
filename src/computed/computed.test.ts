import { computed } from './computed';
import { writable } from '../writable/writable';
import { configure } from '../config/config';
import { batch } from '../core/core';

describe('computed', () => {
  const a = writable(1);
  const b = writable(2);
  const c = writable(3);
  const d = writable(4);

  const a1 = computed((get) => get(b));
  const b1 = computed((get) => get(a) - get(c));
  const c1 = computed((get) => get(b) + get(d));
  const d1 = computed((get) => get(c));

  const a2 = computed((get) => get(b1));
  const b2 = computed((get) => get(a1) - get(c1));
  const c2 = computed((get) => get(b1) + get(d1));
  const d2 = computed((get) => get(c1));

  it('is calculates value properly after creation', () => {
    expect(a2.get()).toBe(-2);
    expect(b2.get()).toBe(-4);
    expect(c2.get()).toBe(1);
    expect(d2.get()).toBe(6);
  });

  it('updates value after dependency value change', () => {
    a.set(4);
    b.set(3);
    c.set(2);
    d.set(1);

    expect(a2.get()).toBe(2);
    expect(b2.get()).toBe(-1);
    expect(c2.get()).toBe(4);
    expect(d2.get()).toBe(4);
  });

  it('updates value properly using batching', () => {
    batch(() => {
      a.set(1);
      b.set(2);
      c.set(3);
      d.set(4);
    });

    expect(a2.get()).toBe(-2);
    expect(b2.get()).toBe(-4);
    expect(c2.get()).toBe(1);
    expect(d2.get()).toBe(6);
  });

  it('updates value properly on subscribers run', () => {
    const a = writable(1);
    const b = writable(2);
    const c = writable(3);
    const d = writable(4);

    const a1 = computed((get) => get(b));
    const b1 = computed((get) => get(a) - get(c));
    const c1 = computed((get) => get(b) + get(d));
    const d1 = computed((get) => get(c));

    const a2 = computed((get) => get(b1));
    const b2 = computed((get) => get(a1) - get(c1));
    const c2 = computed((get) => get(b1) + get(d1));
    const d2 = computed((get) => get(c1));

    let aSub,
      bSub,
      cSub,
      dSub = 0;

    a2.subscribe((v) => {
      aSub = v;
    });
    b2.subscribe((v) => {
      bSub = v;
    });
    c2.subscribe((v) => {
      cSub = v;
    });
    d2.subscribe((v) => {
      dSub = v;
    });

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

    const x2Counter = computed((get) => {
      stringCounter.set(counter.get() + '');
      return get(counter) * 2;
    });

    let value = '';

    stringCounter.subscribe((v) => {
      value = v;
    });
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
    const c = computed((get) => {
      if (get(a) > 5) b.set(10);
      return get(a) + get(b);
    });

    c.subscribe(() => {});
    expect(c.get()).toBe(0);

    a.set(1);
    expect(c.get()).toBe(1);

    a.set(6);
    expect(c.get()).toBe(16);

    b.set(5);
    expect(c.get()).toBe(16);
  });

  it('can pass values to writable signals during computing (case 3)', () => {
    const spy = jest.fn();

    const a = writable(0);
    const b = writable(0);
    const c = writable(0);
    const d = computed((get) => {
      return get(a) + get(b);
    });
    const e = computed((get) => {
      c.get();

      a.set(1);
      b.set(1);

      return '123';
    });

    d.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    e.get();
    expect(d.get()).toBe(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('logs unhandled exceptions', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = writable('bar');
    const count = computed((get) => obj[get(field)]);
    const count2 = computed((get) => get(count));

    count2.subscribe(() => {});

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logs unhandled exceptions in nested computeds', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = writable('bar');
    const count = computed((get) => obj[get(field)]);

    const parent = computed((get) => get(count));

    parent.subscribe(() => {});

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logs unhandled exceptions while computing inactive signal', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const a = writable(0);

    const b = computed((get) => {
      const value = get(a);
      if (value < 10) throw 'ERROR';
      return value;
    });

    b.get();
    expect(spy).toHaveBeenCalledTimes(1);

    b.get();
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    b.get();
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(10);
    b.get();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not make redundant exception logs', () => {
    const errSpy = jest.fn();
    const subSpy = jest.fn();

    configure({ logException: errSpy });

    const a = writable(0);

    const b = computed((get) => {
      if (get(a) > 10) (get(a) as any).foo();
      return get(a);
    });

    const c = writable(0);

    const sum = computed((get) => {
      return get(b) + get(c);
    });

    const sum2 = computed((get) => {
      return get(sum);
    });

    sum2.get();
    a.set(20);
    sum2.get();
    a.set(1);
    sum2.get();

    expect(errSpy).toHaveBeenCalledTimes(1);

    sum2.subscribe(subSpy);
    expect(subSpy).toHaveBeenCalledTimes(1);

    a.set(2);
    expect(subSpy).toHaveBeenCalledTimes(2);

    a.set(155);
    expect(subSpy).toHaveBeenCalledTimes(2);
    expect(errSpy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(subSpy).toHaveBeenCalledTimes(2);
    expect(errSpy).toHaveBeenCalledTimes(2);

    a.set(3);
    expect(subSpy).toHaveBeenCalledTimes(3);
    expect(errSpy).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes inner subscriptions on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const ext = writable(0);

    const comp = computed((get) => {
      ext.subscribe(() => spy());
      return get(source);
    });

    comp.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    ext.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    ext.set(2);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('unsubscribes nested inner subscriptions on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const wrap = writable(0);
    const ext = writable(0);

    const comp = computed((get) => {
      wrap.subscribe(() => {
        ext.subscribe(() => spy());
      });
      return get(source);
    });

    comp.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    ext.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    ext.set(2);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('unsubscribes inner subscriptions in nested computeds on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const ext = writable(0);

    const comp = computed((get) => {
      const wrap = computed((get) => {
        ext.subscribe(() => spy());
      });

      wrap.subscribe(() => {});

      return get(source);
    });

    comp.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    ext.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    ext.set(2);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('unsubscribes all inner subscriptions on parent calculation', () => {
    const innerSpy = jest.fn();
    const externalSpy = jest.fn();
    const deepSpy = jest.fn();

    const source = writable(0);
    const external = writable(0);

    const comp = computed((get) => {
      const inner = computed((get) => {
        const deep = computed((get) => get(external));
        deep.subscribe(() => deepSpy());

        return get(external);
      });

      external.subscribe(() => externalSpy());
      inner.subscribe(() => innerSpy());

      return get(source);
    });

    comp.subscribe(() => {});
    expect(innerSpy).toHaveBeenCalledTimes(1);
    expect(externalSpy).toHaveBeenCalledTimes(1);
    expect(deepSpy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(innerSpy).toHaveBeenCalledTimes(2);
    expect(externalSpy).toHaveBeenCalledTimes(2);
    expect(deepSpy).toHaveBeenCalledTimes(2);

    source.set(2);
    expect(innerSpy).toHaveBeenCalledTimes(3);
    expect(externalSpy).toHaveBeenCalledTimes(3);
    expect(deepSpy).toHaveBeenCalledTimes(3);

    external.set(1);
    expect(innerSpy).toHaveBeenCalledTimes(4);
    expect(externalSpy).toHaveBeenCalledTimes(4);
    expect(deepSpy).toHaveBeenCalledTimes(4);

    external.set(2);
    expect(innerSpy).toHaveBeenCalledTimes(5);
    expect(externalSpy).toHaveBeenCalledTimes(5);
    expect(deepSpy).toHaveBeenCalledTimes(5);

    external.set(3);
    expect(innerSpy).toHaveBeenCalledTimes(6);
    expect(externalSpy).toHaveBeenCalledTimes(6);
    expect(deepSpy).toHaveBeenCalledTimes(6);
  });

  it('handles automatic unsubscribing in the right order', () => {
    const onDeactivateSpy = jest.fn();

    const source = writable(0);
    const ext = writable(0, {
      onDeactivate: () => onDeactivateSpy(),
    });

    const comp = computed((get) => {
      ext.subscribe(() => {});
      return get(source);
    });

    comp.subscribe(() => {});
    expect(onDeactivateSpy).toHaveBeenCalledTimes(0);

    source.set(1);
    expect(onDeactivateSpy).toHaveBeenCalledTimes(1);
  });

  it('handles deep nested automatic unsubscribing in the right order', () => {
    const onDeactivateSpy = jest.fn();

    const source = writable(0);
    const comp = computed((get) => {
      source.get();

      const res = computed((get) => get(source) * 2, {
        onDeactivate: () => onDeactivateSpy(),
      });

      return res;
    });

    const parent = computed((get) => {
      const res = get(comp);
      res.subscribe(() => {});
    });

    parent.subscribe(() => {});
    expect(onDeactivateSpy).toHaveBeenCalledTimes(0);

    source.set(1);
    expect(onDeactivateSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = writable(0);
    const aComp = computed((get) => get(a));
    const b = writable(0);

    aComp.subscribe(() => {
      b.subscribe(() => spy());
    });

    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    b.set(2);
    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('keeps subscriptions made inside a deep nested subscriber', () => {
    const spy = jest.fn();
    const a = writable(0);
    const aComp = computed((get) => get(a));
    const b = writable(0);

    const wrap = computed((get) => {
      aComp.subscribe(() => {
        b.subscribe(() => spy());
      });
    });

    wrap.get();

    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    b.set(2);
    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('passes true as the second compute fn argument if computation was scheduled', () => {
    let lastScheduled = false;
    let lastMedScheduled = false;

    const spy = jest.fn();
    const medSpy = jest.fn();

    const source = writable(0);

    const med = computed((get, scheduled) => {
      lastMedScheduled = scheduled;
      medSpy();
      return get(source) * 2;
    });

    const result = computed((get, scheduled) => {
      lastScheduled = scheduled;
      spy();
      return get(source) < 5 ? get(source) : get(med);
    });

    let unsub = result.subscribe(() => {});

    expect(lastScheduled).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(lastScheduled).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);

    source.set(2);
    expect(lastScheduled).toBe(true);
    expect(spy).toHaveBeenCalledTimes(3);

    unsub();
    result.get();
    expect(spy).toHaveBeenCalledTimes(3);

    source.set(3);
    result.get();
    expect(lastScheduled).toBe(false);
    expect(spy).toHaveBeenCalledTimes(4);

    unsub = result.subscribe(() => {});
    expect(lastScheduled).toBe(false);
    expect(spy).toHaveBeenCalledTimes(4);

    source.set(10);
    expect(lastScheduled).toBe(true);
    expect(lastMedScheduled).toBe(false);
    expect(medSpy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(5);

    source.set(11);
    expect(lastScheduled).toBe(true);
    expect(lastMedScheduled).toBe(true);
    expect(medSpy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledTimes(6);

    source.set(4);
    expect(lastScheduled).toBe(true);
    expect(lastMedScheduled).toBe(true);
    expect(medSpy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledTimes(7);

    med.get();
    expect(lastMedScheduled).toBe(false);

    source.set(11);
    source.set(4);
    source.set(11);
    expect(lastMedScheduled).toBe(false);
  });

  it('passes true as second compute fn argument if computation was scheduled (case 2)', () => {
    let lastScheduled: boolean | undefined;

    const spy = jest.fn();

    const a = writable(0);
    const b = writable(0);

    const c = computed((get: any, scheduled?: boolean) => {
      lastScheduled = scheduled;
      spy();
      return get(a);
    });

    const d = computed((get) => {
      if (get(b)) c.subscribe(() => {});
      return get(b);
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

    const a = computed((get) => {
      const v = get(source);

      if (v > 10 && unsub) unsub();
      return v;
    });

    a.subscribe(() => {});

    const b = computed((get) => {
      spy();
      return get(source);
    });

    const c = computed((get) => get(b));

    unsub = c.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    source.set(11);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not trigger dependants until its value is changed by default', () => {
    const counter = writable(0);
    const x2Counter = computed((get) => get(counter) * 2);
    const spy = jest.fn();

    x2Counter.subscribe(spy, false);

    expect(counter.get()).toBe(0);
    expect(x2Counter.get()).toBe(0);
    expect(spy).toHaveBeenCalledTimes(0);

    counter.set(0);
    expect(counter.get()).toBe(0);
    expect(x2Counter.get()).toBe(0);
    expect(spy).toHaveBeenCalledTimes(0);

    counter.set(1);
    expect(counter.get()).toBe(1);
    expect(x2Counter.get()).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);

    counter.set(2);
    expect(counter.get()).toBe(2);
    expect(x2Counter.get()).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);

    counter.set(2);
    expect(counter.get()).toBe(2);
    expect(x2Counter.get()).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = writable(0);
    const b = computed((get) => get(a));
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not ignore any new value if the second arg returns true', () => {
    const a = writable(0, {
      equal: () => false,
    });
    const b = computed((get) => get(a), {
      equal: () => false,
    });
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('can use custom compare function', () => {
    const a = writable(0, {
      equal: () => false,
    });
    const b = computed((get) => get(a), {
      equal: (value) => value >= 5,
    });
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(5);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('can filter values using undefined value', () => {
    const a = writable(0, {
      equal: () => false,
    });
    const b = computed(
      (get) => {
        const value = get(a);
        if (value < 5) return value;
      },
      {
        equal: () => false,
      }
    );
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(5);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('allows to handle inactive signal exceptions', () => {
    const count = writable(0);

    const withError = computed((get) => {
      if (get(count) < 5) throw Error();
      return get(count);
    });

    const handledError = computed((get) => {
      let result = 42;

      try {
        result = get(withError);
      } finally {
        return result;
      }
    });

    expect(handledError.get()).toBe(42);

    count.set(5);
    expect(handledError.get()).toBe(5);

    count.set(4);
    expect(handledError.get()).toBe(42);
  });

  it('allows to handle active signal exceptions', () => {
    const errorSpy = jest.fn();

    configure({
      logException: errorSpy,
    });

    const count = writable(0);

    const withError = computed((get) => {
      if (get(count) < 5) throw Error();
      return get(count);
    });

    const withErrorComp = computed((get) => get(withError));
    const unsub1 = withErrorComp.subscribe(() => {}, false);

    expect(errorSpy).toHaveBeenCalledTimes(1);

    const handledError = computed((get) => {
      let result = 42;

      try {
        result = get(withError);
      } finally {
        return result;
      }
    });
    const unsub2 = handledError.subscribe(() => {}, false);

    expect(handledError.get()).toBe(42);

    count.set(5);
    expect(handledError.get()).toBe(5);

    count.set(4);
    expect(handledError.get()).toBe(42);
    expect(errorSpy).toHaveBeenCalledTimes(2); // check logging on middle computed with subs and dependants

    unsub2();
    count.set(2);
    expect(errorSpy).toHaveBeenCalledTimes(3); // check logging on middle computed with subs only

    unsub1();
    handledError.subscribe(() => {}, false);
    count.set(1);
    expect(errorSpy).toHaveBeenCalledTimes(3);
  });
});
