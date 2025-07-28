// import { signal, configure, batch } from '..';
import { signal, configure, batch } from '..';

describe('computed', () => {
  const a = signal(1);
  const b = signal(2);
  const c = signal(3);
  const d = signal(4);

  const a1 = signal((get) => get(b));
  const b1 = signal((get) => get(a) - get(c));
  const c1 = signal((get) => get(b) + get(d));
  const d1 = signal((get) => get(c));

  const a2 = signal((get) => get(b1));
  const b2 = signal((get) => get(a1) - get(c1));
  const c2 = signal((get) => get(b1) + get(d1));
  const d2 = signal((get) => get(c1));

  it('is calculates value properly after creation', () => {
    expect(a2.value).toBe(-2);
    expect(b2.value).toBe(-4);
    expect(c2.value).toBe(1);
    expect(d2.value).toBe(6);
  });

  it('updates value after dependency value change', () => {
    a.set(4);
    b.set(3);
    c.set(2);
    d.set(1);

    expect(a2.value).toBe(2);
    expect(b2.value).toBe(-1);
    expect(c2.value).toBe(4);
    expect(d2.value).toBe(4);
  });

  it('updates value properly using batching', () => {
    batch(() => {
      a.set(1);
      b.set(2);
      c.set(3);
      d.set(4);
    });

    expect(a2.value).toBe(-2);
    expect(b2.value).toBe(-4);
    expect(c2.value).toBe(1);
    expect(d2.value).toBe(6);
  });

  it('updates value properly on subscribers run', () => {
    const a = signal(1);
    const b = signal(2);
    const c = signal(3);
    const d = signal(4);

    const a1 = signal((get) => get(b));
    const b1 = signal((get) => get(a) - get(c));
    const c1 = signal((get) => get(b) + get(d));
    const d1 = signal((get) => get(c));

    const a2 = signal((get) => get(b1));
    const b2 = signal((get) => get(a1) - get(c1));
    const c2 = signal((get) => get(b1) + get(d1));
    const d2 = signal((get) => get(c1));

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
    expect(a.subscribe).toBeDefined;
    expect(a.pipe).toBeDefined;
  });

  it('can pass values to writable signals during computing', () => {
    const counter = signal(0);
    const stringCounter = signal('0');

    const x2Counter = signal((get) => {
      stringCounter.set(counter.value + '');
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
    const a = signal(0);
    const b = signal(0);
    const c = signal((get) => {
      if (get(a) > 5) b.set(10);
      return get(a) + get(b);
    });

    c.subscribe(() => {});
    expect(c.value).toBe(0);

    a.set(1);
    expect(c.value).toBe(1);

    a.set(6);
    expect(c.value).toBe(16);

    b.set(5);
    expect(c.value).toBe(16);
  });

  it('can pass values to writable signals during computing (case 3)', () => {
    const spy = jest.fn();

    const a = signal(0);
    const b = signal(0);
    const c = signal(0);
    const d = signal((get) => {
      return get(a) + get(b);
    });
    const e = signal((get) => {
      c.value;

      a.set(1);
      b.set(1);

      return '123';
    });

    d.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    e.value;
    expect(d.value).toBe(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('logs unhandled exceptions', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = signal('bar');
    const count = signal((get) => obj[get(field)]);
    const count2 = signal((get) => get(count));

    count2.subscribe(() => {});

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logs unhandled exceptions in nested computeds', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = signal('bar');
    const count = signal((get) => obj[get(field)]);

    const parent = signal((get) => get(count));

    parent.subscribe(() => {});

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logs unhandled exceptions while computing inactive signal', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const a = signal(0);

    const b = signal((get) => {
      const value = get(a);
      if (value < 10) throw 'ERROR';
      return value;
    });

    b.value;
    expect(spy).toHaveBeenCalledTimes(1);

    b.value;
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    b.value;
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(10);
    b.value;
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not make redundant exception logs', () => {
    const errSpy = jest.fn();
    const subSpy = jest.fn();

    configure({ logException: errSpy });

    const a = signal(0);

    const b = signal((get) => {
      if (get(a) > 10) (get(a) as any).foo();
      return get(a);
    });

    const c = signal(0);

    const sum = signal((get) => {
      return get(b) + get(c);
    });

    const sum2 = signal((get) => {
      return get(sum);
    });

    sum2.value;
    a.set(20);
    sum2.value;
    a.set(1);
    sum2.value;

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

    const source = signal(0);
    const ext = signal(0);

    const comp = signal((get) => {
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

    const source = signal(0);
    const wrap = signal(0);
    const ext = signal(0);

    const comp = signal((get) => {
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

    const source = signal(0);
    const ext = signal(0);

    const comp = signal((get) => {
      const wrap = signal((get) => {
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

    const source = signal(0);
    const external = signal(0);

    const comp = signal((get) => {
      const inner = signal((get) => {
        const deep = signal((get) => get(external));
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

    const source = signal(0);
    const ext = signal(0, {
      onDeactivate: () => onDeactivateSpy(),
    });

    const comp = signal((get) => {
      ext.subscribe(() => {});
      return get(source);
    });

    comp.subscribe(() => {});
    expect(onDeactivateSpy).toHaveBeenCalledTimes(0);

    source.set(1);
    expect(onDeactivateSpy).toHaveBeenCalledTimes(1);
  });

  it('handles deep nested automatic unsubscribing in the right order', () => {
    const onDeactivate = jest.fn();

    const source = signal(0);
    const comp = signal((get) => {
      get(source);

      const res = signal((get) => get(source) * 2, {
        onDeactivate,
      });

      return res;
    });

    const parent = signal((get) => {
      const res = get(comp);
      res.subscribe(() => {});
    });

    parent.subscribe(() => {});
    expect(onDeactivate).toHaveBeenCalledTimes(0);

    source.set(1);
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = signal(0);
    const aComp = signal((get) => get(a));
    const b = signal(0);

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
    const a = signal(0);
    const aComp = signal((get) => get(a));
    const b = signal(0);

    const wrap = signal((get) => {
      aComp.subscribe(() => {
        b.subscribe(() => spy());
      });
    });

    wrap.value;

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

    const source = signal(0);

    const med = signal((get, scheduled) => {
      lastMedScheduled = scheduled;
      medSpy();
      return get(source) * 2;
    });

    const result = signal((get, scheduled) => {
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
    result.value;
    expect(spy).toHaveBeenCalledTimes(3);

    source.set(3);
    result.value;
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

    med.value;
    expect(lastMedScheduled).toBe(false);

    source.set(11);
    source.set(4);
    source.set(11);
    expect(lastMedScheduled).toBe(false);
  });

  it('passes true as second compute fn argument if computation was scheduled (case 2)', () => {
    let lastScheduled: boolean | undefined;

    const spy = jest.fn();

    const a = signal(0);
    const b = signal(0);

    const c = signal((get: any, scheduled?: boolean) => {
      lastScheduled = scheduled;
      spy();
      return get(a);
    });

    const d = signal((get) => {
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

    const source = signal(0);
    let unsub: any;

    const a = signal((get) => {
      const v = get(source);

      if (v > 10 && unsub) unsub();
      return v;
    });

    a.subscribe(() => {});

    const b = signal((get) => {
      spy();
      return get(source);
    });

    const c = signal((get) => get(b));

    unsub = c.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    source.set(11);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not trigger dependants until its value is changed by default', () => {
    const counter = signal(0);
    const x2Counter = signal((get) => get(counter) * 2);
    const spy = jest.fn();

    x2Counter.subscribe(spy, false);

    expect(counter.value).toBe(0);
    expect(x2Counter.value).toBe(0);
    expect(spy).toHaveBeenCalledTimes(0);

    counter.set(0);
    expect(counter.value).toBe(0);
    expect(x2Counter.value).toBe(0);
    expect(spy).toHaveBeenCalledTimes(0);

    counter.set(1);
    expect(counter.value).toBe(1);
    expect(x2Counter.value).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);

    counter.set(2);
    expect(counter.value).toBe(2);
    expect(x2Counter.value).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);

    counter.set(2);
    expect(counter.value).toBe(2);
    expect(x2Counter.value).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = signal(0);
    const b = signal((get) => get(a));
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

  it('commits any new value if the equal option is set to false', () => {
    const a = signal(0, {
      equal: false,
    });
    const b = signal((get) => get(a), {
      equal: false,
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

  it('can use custom equality check', () => {
    const a = signal(0, {
      equal: () => false,
    });
    const b = signal((get) => get(a), {
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
    const a = signal(0, {
      equal: () => false,
    });
    const b = signal(
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
    const count = signal(0);

    const withError = signal((get) => {
      if (get(count) < 5) throw Error();
      return get(count);
    });

    const handledError = signal((get) => {
      let result = 42;

      try {
        result = get(withError);
      } finally {
        return result;
      }
    });

    expect(handledError.value).toBe(42);

    count.set(5);
    expect(handledError.value).toBe(5);

    count.set(4);
    expect(handledError.value).toBe(42);
  });

  it('allows to handle active signal exceptions', () => {
    const errorSpy = jest.fn();

    configure({
      logException: errorSpy,
    });

    const count = signal(0);

    const withError = signal((get) => {
      if (get(count) < 5) throw Error();
      return get(count);
    });

    const withErrorComp = signal((get) => get(withError));
    const unsub1 = withErrorComp.subscribe(() => {}, false);

    expect(errorSpy).toHaveBeenCalledTimes(1);

    const handledError = signal((get) => {
      let result = 42;

      try {
        result = get(withError);
      } finally {
        return result;
      }
    });
    const unsub2 = handledError.subscribe(() => {}, false);

    expect(handledError.value).toBe(42);

    count.set(5);
    expect(handledError.value).toBe(5);

    count.set(4);
    expect(handledError.value).toBe(42);
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
