import { atom, computed, batch, configure } from './core';

describe('atom', () => {
  const counter = atom(0);

  it('is created with default value', () => {
    expect(counter.get()).toBe(0);
  });

  it('updates value', () => {
    counter.set(1);
    expect(counter.get()).toBe(1);
  });

  it('updates value using set method', () => {
    counter.set(2);
    expect(counter.get()).toBe(2);
  });

  it('returns void after set', () => {
    const newValue = counter.set(3);
    expect(newValue).toBeUndefined();
  });

  it('updates value using update fn', () => {
    counter.update((value) => value + 1);
    expect(counter.get()).toBe(4);

    batch(() => {
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
    });

    expect(counter.get()).toBe(8);
  });

  it('updates value using update fn right after init', () => {
    const counter = atom(0);

    counter.update((v) => v + 1);
    expect(counter.get()).toBe(1);
  });

  it('force triggers subscribers using update method with a function that returns void', () => {
    const s = atom(
      {} as {
        a?: number;
      }
    );

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(value).toBe(undefined);

    s.update((value) => {
      value.a = 1;
    });

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(1);

    s.update((value) => {
      value.a = 2;
    });

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(2);

    s.set(s.get());

    expect(subscriber).toHaveBeenCalledTimes(3);
  });

  it('force triggers subscribers using update method without arguments', () => {
    const s = atom(
      {} as {
        a?: number;
      }
    );

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.update();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(undefined);

    s.get().a = 1;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.get().a = 2;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.get());

    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('force triggers dependent subscribers using update method without arguments', () => {
    const s = atom(
      {} as {
        a?: number;
      }
    );
    const comp = computed((get) => get(s).a || null, {
      equal: false,
    });

    let value: any;

    const subscriber = jest.fn((v: any) => {
      value = v;
    });

    comp.subscribe(subscriber);

    s.update();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(null);

    s.get().a = 1;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.get().a = 2;
    s.update();

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.get());

    expect(value).toBe(2);
    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = atom(0);
    const b = atom(0);

    a.subscribe(() => {
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

  it('can have fn value', () => {
    const a = () => {};
    const b = () => {};
    const fn = atom(a);

    expect(fn.get()).toBe(a);

    fn.set(b);
    expect(fn.get()).toBe(b);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = atom(0);
    const spy = jest.fn();

    a.subscribe(spy);
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

  it('does not ignore any new value if the equal is set to false', () => {
    const a = atom(0, {
      equal: false,
    });
    const spy = jest.fn();

    a.subscribe(spy);
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

  it('can use custom equality function', () => {
    const a = atom(0, {
      equal(value) {
        return value >= 5;
      },
    });

    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(5);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(a.get()).toBe(1);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('does not notify subscribers when an atom returns to the original value inside batch', () => {
    const count = atom(0);
    const listener = jest.fn();

    count.subscribe(listener);
    listener.mockClear();

    batch(() => {
      count.set(1);
      count.set(2);
      count.set(0);
    });

    expect(count.get()).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('computed', () => {
  const a = atom(1);
  const b = atom(2);
  const c = atom(3);
  const d = atom(4);

  const a1 = computed((get) => get(b));
  const b1 = computed((get) => get(a) - get(c));
  const c1 = computed((get) => get(b) + get(d));
  const d1 = computed((get) => get(c));

  const a2 = computed((get) => get(b1));
  const b2 = computed((get) => get(a1) - get(c1));
  const c2 = computed((get) => get(b1) + get(d1));
  const d2 = computed((get) => get(c1));

  it('calculates value properly after creation', () => {
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

  it('does not recompute when an atom returns to the original value inside batch', () => {
    const count = atom(0);
    const compute = jest.fn((track) => track(count) * 2);
    const double = computed(compute);

    expect(double.get()).toBe(0);
    expect(compute).toHaveBeenCalledTimes(1);

    batch(() => {
      count.set(1);
      count.set(2);
      count.set(0);
    });

    expect(double.get()).toBe(0);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('updates value properly on subscribers run', () => {
    const a = atom(1);
    const b = atom(2);
    const c = atom(3);
    const d = atom(4);

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

  it('can pass values to atoms during computing', () => {
    const counter = atom(0);
    const stringCounter = atom('0');

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

  it('can pass values to writable atoms during computing (case 2)', () => {
    const a = atom(0);
    const b = atom(0);
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

  it('can pass values to writable atoms during computing (case 3)', () => {
    const spy = jest.fn();

    const a = atom(0);
    const b = atom(0);
    const c = atom(0);
    const d = computed((get) => {
      return get(a) + get(b);
    });
    const e = computed(() => {
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

  it('logs unhandled exceptions in nested computeds', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = atom('bar');
    const count = computed((get) => obj[get(field)]);

    const parent = computed((get) => get(count));

    parent.subscribe(() => {});

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('logs unhandled exceptions while computing inactive atom', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const a = atom(0);

    const b = computed((get) => {
      const value = get(a);
      if (value < 10) throw 'ERROR';
      return value;
    });

    b.get();
    expect(spy).toHaveBeenCalledTimes(1);

    b.get();
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    b.get();
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(10);
    b.get();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not make redundant exception logs', () => {
    const errSpy = jest.fn();
    const subSpy = jest.fn();

    configure({ logException: errSpy });

    const a = atom(0);

    const b = computed((get) => {
      if (get(a) > 10) (get(a) as any).foo();
      return get(a);
    });

    const c = atom(0);

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

    const source = atom(0);
    const ext = atom(0);

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

    const source = atom(0);
    const wrap = atom(0);
    const ext = atom(0);

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

    const source = atom(0);
    const ext = atom(0);

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

    const source = atom(0);
    const external = atom(0);

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

  it('does not call stale inner atom subscriptions when parent and inner source update in the same batch', () => {
    const externalSpy = jest.fn();

    const source = atom(0);
    const external = atom(0);

    const comp = computed((track) => {
      external.subscribe(() => externalSpy());

      return track(source);
    });

    comp.subscribe(() => {});
    expect(externalSpy).toHaveBeenCalledTimes(1);

    batch(() => {
      source.set(1);
      external.set(1);
    });

    expect(externalSpy).toHaveBeenCalledTimes(2);
  });

  it('notifies subscribers from outer to inner computed levels', () => {
    const calls: string[] = [];

    const source = atom(0);
    const external = atom(0);

    const comp = computed((track) => {
      const inner = computed((track) => {
        const deep = computed((track) => track(external));

        deep.subscribe(() => {
          calls.push('deep');
        });

        return track(external);
      });

      external.subscribe(() => {
        calls.push('external');
      });

      inner.subscribe(() => {
        calls.push('inner');
      });

      return track(source);
    });

    comp.subscribe(() => {
      calls.push('comp');
    });

    calls.length = 0;

    external.set(1);

    expect(calls).toEqual(['external', 'deep', 'inner']);
  });

  it('notifies subscribers in level order after nested subscriptions are recreated', () => {
    const calls: string[] = [];

    const source = atom(0);
    const external = atom(0);

    const comp = computed((track) => {
      const inner = computed((track) => {
        const deep = computed((track) => track(external));

        deep.subscribe(() => {
          calls.push('deep');
        });

        return track(external);
      });

      external.subscribe(() => {
        calls.push('external');
      });

      inner.subscribe(() => {
        calls.push('inner');
      });

      return track(source);
    });

    comp.subscribe(() => {
      calls.push('comp');
    });

    calls.length = 0;

    source.set(1);

    expect(calls).toEqual(['external', 'deep', 'inner', 'comp']);

    calls.length = 0;

    source.set(2);

    expect(calls).toEqual(['external', 'deep', 'inner', 'comp']);

    calls.length = 0;

    external.set(1);

    expect(calls).toEqual(['external', 'deep', 'inner']);
  });

  // it('handles automatic unsubscribing in the right order', () => {
  //   const onDeactivateSpy = jest.fn();

  //   const source = atom(0);

  //   const ext = atom(0, {
  //     onDeactivate: () => onDeactivateSpy(),
  //   });

  //   const comp = computed((get) => {
  //     ext.subscribe(() => {});
  //     return get(source);
  //   });

  //   comp.subscribe(() => {});
  //   expect(onDeactivateSpy).toHaveBeenCalledTimes(0);

  //   source.set(1);
  //   expect(onDeactivateSpy).toHaveBeenCalledTimes(1);
  // });

  // it('handles deep nested automatic unsubscribing in the right order', () => {
  //   const onDeactivate = jest.fn();

  //   const source = atom(0);
  //   const comp = computed((get) => {
  //     get(source);

  //     const res = computed((get) => get(source) * 2, {
  //       onDeactivate,
  //     });

  //     return res;
  //   });

  //   const parent = computed((get) => {
  //     const res = get(comp);
  //     res.subscribe(() => {});
  //   });

  //   parent.subscribe(() => {});
  //   expect(onDeactivate).toHaveBeenCalledTimes(0);

  //   source.set(1);
  //   expect(onDeactivate).toHaveBeenCalledTimes(1);
  // });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = atom(0);
    const aComp = computed((get) => get(a));
    const b = atom(0);

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
    const a = atom(0);
    const aComp = computed((get) => get(a));
    const b = atom(0);

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

  it('does not recalculates if became inactive during previous calculations', () => {
    const spy = jest.fn();

    const source = atom(0);
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
    const counter = atom(0);
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
    const a = atom(0);
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

  it('commits any new value if the equal option is set to false', () => {
    const a = atom(0, {
      equal: false,
    });
    const b = computed((get) => get(a), {
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
    const a = atom(0, {
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

  it('can filter values using prev value passed as the second argument of the computation', () => {
    const a = atom(0);
    const b = computed<number | undefined>((get, prevValue) => {
      const value = get(a);
      if (value < 5) return value;
      return prevValue;
    });
    const spy = jest.fn();

    b.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(5);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('allows to handle inactive atom exceptions', () => {
    const count = atom(0);

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

  it('allows to handle active atom exceptions', () => {
    const errorSpy = jest.fn();

    configure({
      logException: errorSpy,
    });

    const count = atom(0);

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

  it('does not revalidate an unchanged atom on every read within the same global version', () => {
    const equal = jest.fn(Object.is);

    const source = atom(1, { equal });
    const unrelated = atom(0);

    source.get();
    equal.mockClear();

    unrelated.set(1);

    source.get();
    source.get();

    expect(equal).toHaveBeenCalledTimes(1);
  });
});

describe('store', () => {
  beforeEach(() => {
    configure({
      logException: () => {},
    });
  });

  const counter = atom(0);
  let unsubs: (() => any)[] = [];
  let num: number;
  let x2Num: number;

  const subscriber = jest.fn((value: number) => {
    num = value;
  });

  const altSubscriber = jest.fn((value: number) => {
    x2Num = value * 2;
  });

  it('runs subscribers on subscribe', () => {
    unsubs.push(counter.subscribe(subscriber));
    counter.subscribe(altSubscriber);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(num).toBe(0);
    expect(x2Num).toBe(0);
  });

  it('runs subscribers on every incoming value that differs from the previous', () => {
    counter.set(0);
    counter.set(1);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
    expect(x2Num).toBe(2);

    counter.set(2);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(num).toBe(2);
    expect(x2Num).toBe(4);
  });

  it('passes previous value as second subscriber argument except immediate run', () => {
    const a = atom(0);
    const subscriber = jest.fn();

    expect(subscriber).toHaveBeenCalledTimes(0);

    a.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastCalledWith(0);

    a.set(1);
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenLastCalledWith(1, 0);

    a.set(2);
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber).toHaveBeenLastCalledWith(2, 1);
  });

  it('allows to subscribe the fn more than once', () => {
    unsubs.push(counter.subscribe(subscriber));

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(num).toBe(2);
  });

  it('stops to trigger subscribers after unsubscribe', () => {
    unsubs.forEach((fn) => fn());
    counter.set(3);

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(num).toBe(2);

    unsubs.forEach((fn) => fn());
  });

  it('preserves subscription order for the same store', () => {
    const calls: string[] = [];
    const a = atom(0);

    a.subscribe(() => {
      calls.push('first');
    });

    a.subscribe(() => {
      calls.push('second');
    });

    calls.length = 0;

    a.set(1);

    expect(calls).toEqual(['first', 'second']);
  });

  // it('correctly handles subscribing and unsubscribing to a store without dependencies', () => {
  //   const frozenSub = jest.fn();
  //   const onActivate = jest.fn();
  //   const onDeactivate = jest.fn();

  //   const frozen = computed((get) => 0, { onActivate, onDeactivate });

  //   const unsubFrozen = frozen.subscribe(frozenSub);
  //   expect(onDeactivate).toHaveBeenCalledTimes(0);
  //   expect(onActivate).toHaveBeenCalledTimes(1);
  //   expect(frozenSub).toHaveBeenCalledTimes(1);

  //   unsubFrozen();
  //   expect(onDeactivate).toHaveBeenCalledTimes(1);
  //   expect(onActivate).toHaveBeenCalledTimes(1);
  //   expect(frozenSub).toHaveBeenCalledTimes(1);
  // });

  it('correctly handles multiple unsubscribing', () => {
    const x2Counter = computed((get) => 2 * get(counter));
    const x2Unsub = x2Counter.subscribe(() => {});

    expect(x2Counter.get()).toBe(6);

    x2Unsub();
    x2Unsub();

    counter.set(4);
    expect(x2Counter.get()).toBe(8);
  });

  it('does not track itself on subscribing', () => {
    const counter = atom(0);
    const gt5 = computed((get) => get(counter) > 5);
    const res = computed((get) => {
      if (get(gt5)) {
        const obj: any = {};

        counter.subscribe((v) => {
          obj.value = v;
        });
        return obj;
      }

      return {} as any;
    });

    const spy = jest.fn();

    res.subscribe(spy, false);

    counter.set(1);
    counter.set(2);
    counter.set(3);
    counter.set(6);
    counter.set(7);
    counter.set(8);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not track dependencies inside subscriber function', () => {
    const counter = atom(0);
    const gt5 = computed((get) => get(counter) > 5);
    const res = computed((get) => {
      if (get(gt5)) {
        const obj: any = {};

        counter.subscribe((v) => {
          obj.value = counter.get();
        });

        return obj;
      }

      return {} as any;
    });

    const spy = jest.fn();

    res.subscribe(spy, false);

    counter.set(1);
    counter.set(2);
    counter.set(3);
    counter.set(6);
    counter.set(7);
    counter.set(8);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('runs subscribers in the right order', () => {
    const a = atom(1);
    const b = computed((get) => get(a));
    const c = computed((get) => get(b));

    const res: string[] = [];

    b.subscribe((v) => res.push('b' + v));
    b.subscribe((v) => res.push('bb' + v));
    a.subscribe((v) => res.push('a' + v));
    c.subscribe((v) => res.push('c' + v));

    a.set(2);

    expect(res.join(' ')).toBe('b1 bb1 a1 c1 a2 b2 bb2 c2');
  });

  it('handles diamond problem', () => {
    /*
     *            ┌─────┐
     *            │  a  │
     *            └──┬──┘
     *     ┌─────────┴────────┐
     *  ┌──▼──┐            ┌──▼──┐
     *  │  b  │            │  c  │
     *  └──┬──┘            └──┬──┘
     *     │               ┌──▼──┐
     *     │               │  d  │
     *     │               └──┬──┘
     *     └─────────┬────────┘
     *            ┌──▼──┐
     *            │  e  │
     *            └─────┘
     */

    const a = atom(0);
    const b = computed((get) => get(a) * 2);
    const c = computed((get) => get(a) * 2);
    const d = computed((get) => get(c) * 2);
    const e = computed((get) => get(b) + get(d));

    const subscriber = jest.fn();

    e.subscribe(subscriber, false);

    a.set(1);

    expect(e.get()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('handles diamond problem (case 2)', () => {
    /*
     *            ┌─────┐
     *            │  a  │
     *            └──┬──┘
     *            ┌──▼──┐
     *            │  b  │
     *            └──┬──┘
     *     ┌─────────┴────────┐
     *  ┌──▼──┐               │
     *  │  c  │               │
     *  └──┬──┘               │
     *     └─────────┬────────┘
     *            ┌──▼──┐
     *            │  d  │
     *            └─────┘
     */

    const a = atom(0);
    const b = computed((get) => get(a) * 2);
    const c = computed((get) => get(b) * 2);
    const d = computed((get) => get(c) + get(b));

    const subscriber = jest.fn();

    d.subscribe(subscriber, false);

    a.set(1);

    expect(d.get()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('dynamically updates dependencies', () => {
    const counter = atom(0);
    const tumbler = atom(false);
    const x2Counter = computed((get) => get(counter) * 2);
    const result = computed((get) => (get(tumbler) ? get(x2Counter) : 'FALSE'));

    const subscriber = jest.fn();

    result.subscribe(subscriber, false);

    expect(result.get()).toBe('FALSE');

    counter.set(1);
    expect(result.get()).toBe('FALSE');
    expect(subscriber).toHaveBeenCalledTimes(0);

    batch(() => {
      tumbler.set(true);
      counter.set(2);
    });

    expect(result.get()).toBe(4);
    expect(subscriber).toHaveBeenCalledTimes(1);

    tumbler.set(false);
    counter.set(3);
    expect(result.get()).toBe('FALSE');
    expect(subscriber).toHaveBeenCalledTimes(2);

    counter.set(4);
    expect(result.get()).toBe('FALSE');
    expect(subscriber).toHaveBeenCalledTimes(2);

    tumbler.set(true);
    expect(result.get()).toBe(8);
    expect(subscriber).toHaveBeenCalledTimes(3);

    counter.set(5);
    expect(result.get()).toBe(10);
    expect(subscriber).toHaveBeenCalledTimes(4);

    counter.set(6);
    expect(result.get()).toBe(12);
    expect(subscriber).toHaveBeenCalledTimes(5);
  });

  it('dynamically updates dependencies (case 2)', () => {
    const tumbler = atom(true);
    const a = atom('a');
    const b = atom('b');

    const sum = computed((get) => {
      if (get(tumbler)) return get(a) + get(b);
      return get(b) + get(a);
    });

    const subSum = jest.fn();

    sum.subscribe(subSum);

    expect(subSum).toHaveBeenCalledTimes(1);

    tumbler.set(false);
    expect(subSum).toHaveBeenCalledTimes(2);

    tumbler.set(true);
    expect(subSum).toHaveBeenCalledTimes(3);
  });

  it('dynamically updates dependencies (case 3)', () => {
    const spy = jest.fn();
    const a = atom(11);
    const b = atom(2);
    const bComp = computed((get) => {
      spy();
      return get(b);
    });

    const value = computed((get) => {
      if (get(a) > 10) return get(bComp) + get(bComp) + get(bComp);
      return get(a);
    });

    value.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(1);

    b.set(2);
    b.set(3);
    b.set(4);
    b.set(5);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('dynamically updates dependencies (case 4)', () => {
    let res = '';

    const fib: (n: number) => number = (n: number) =>
      n < 2 ? 1 : fib(n - 1) + fib(n - 2);

    const hard = (n: number, l: string) => {
      res += l;
      return n + fib(16);
    };

    const A = atom(0);
    const B = atom(0);
    const C = computed((get) => (get(A) % 2) + (get(B) % 2));
    const D = computed((get) => (get(A) % 2) - (get(B) % 2));
    const E = computed((get) => hard(get(C) + get(A) + get(D), 'E'));
    const F = computed((get) => hard(get(D) && get(B), 'F'));
    const G = computed(
      (get) => get(C) + (get(C) || get(E) % 2) + get(D) + get(F)
    );
    const H = G.subscribe((v) => {
      hard(v, 'H');
    });
    const I = G.subscribe(() => {});
    const J = F.subscribe((v) => {
      hard(v, 'J');
    });

    res = '';

    batch(() => {
      B.set(1);
      A.set(3);
    });

    expect(res).toBe('H');

    res = '';

    batch(() => {
      A.set(4);
      B.set(2);
    });

    expect(res).toBe('EH');

    res = '';

    batch(() => {
      A.set(3);
      B.set(1);
    });

    expect(res).toBe('H');

    res = '';

    batch(() => {
      A.set(4);
      B.set(2);
    });

    expect(res).toBe('EH');
  });

  it('dynamically updates dependencies (case 5)', () => {
    const spy = jest.fn();

    const a = atom(0);
    const b = atom(0);
    const c = atom(0);

    const d = computed((get) => {
      if (get(a) < 10) return get(a) + get(b);
      return get(c) + get(a);
    });

    const unsub = d.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    c.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    unsub();
    a.set(11);
    expect(d.get()).toBe(12);

    d.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(4);

    a.set(12);
    expect(spy).toHaveBeenCalledTimes(5);

    b.set(2);
    expect(spy).toHaveBeenCalledTimes(5);

    c.set(2);
    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('dynamically updates dependencies (case 6)', () => {
    const spy = jest.fn();

    let tumbler = true;

    const a = atom(0);
    const b = atom(0);
    const c = atom(0);

    const d = computed((get) => {
      if (tumbler) return get(a) + get(b) + get(c);
      return -1;
    });

    const unsub = d.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    tumbler = false;
    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(2);

    unsub();
    a.set(3);
    expect(d.get()).toBe(-1); // d is frozen after it has lost its dependencies
  });

  it('dynamically updates dependencies (case 7)', () => {
    // check rare infinite dependency loop case

    const spy = jest.fn();

    const tumbler = atom(0);
    const a = atom(1);
    const b = atom(2);
    const c = atom(3);
    const d = atom(4);

    const a1 = computed((get) => {
      if (get(tumbler)) return get(a);
      return get(b);
    });

    const b1 = computed((get) => {
      if (get(tumbler)) return get(b);
      return get(a) - get(c);
    });

    const c1 = computed((get) => {
      if (get(tumbler)) return get(c);
      return get(b) + get(d);
    });

    const d1 = computed((get) => {
      if (get(tumbler)) return get(d);
      return get(c);
    });

    const a2 = computed((get) => {
      if (get(tumbler)) return get(a1);
      return get(b1);
    });

    const b2 = computed((get) => {
      if (get(tumbler)) return get(b1);
      return get(a1) - get(c1);
    });

    const c2 = computed((get) => {
      if (get(tumbler)) return get(c1);
      return get(b1) + get(d1);
    });

    const d2 = computed((get) => {
      if (get(tumbler)) return get(d1);
      return get(c1);
    });

    a2.subscribe(spy);
    b2.subscribe(spy);
    c2.subscribe(spy);
    d2.subscribe(spy);

    expect(a2.get()).toBe(-2);
    expect(b2.get()).toBe(-4);
    expect(c2.get()).toBe(1);
    expect(d2.get()).toBe(6);

    batch(() => {
      a.set(4);
      b.set(3);
      c.set(2);
      d.set(1);
    });

    expect(a2.get()).toBe(2);
    expect(b2.get()).toBe(-1);
    expect(c2.get()).toBe(4);
    expect(d2.get()).toBe(4);

    tumbler.set(1);

    expect(a2.get()).toBe(4);
    expect(b2.get()).toBe(3);
    expect(c2.get()).toBe(2);
    expect(d2.get()).toBe(1);
  });

  it('does not recalc a dependant if it is not active', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = atom(1);

    const b = computed((get) => {
      bSpy();
      return get(a) * 2;
    });

    const c = computed((get) => {
      cSpy();
      return get(b) * 2;
    });

    c.get();
    expect(bSpy).toHaveBeenCalledTimes(1);
    expect(cSpy).toHaveBeenCalledTimes(1);

    a.set(2);
    expect(bSpy).toHaveBeenCalledTimes(1);
    expect(cSpy).toHaveBeenCalledTimes(1);

    b.subscribe(() => {});
    expect(bSpy).toHaveBeenCalledTimes(2);
    expect(cSpy).toHaveBeenCalledTimes(1);

    a.set(3);
    expect(bSpy).toHaveBeenCalledTimes(3);
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  it('does not recalc a dependant if it is not active (case 2)', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = atom(1);

    const b = computed((get) => {
      bSpy();
      return get(a) * 2;
    });

    const c = computed((get) => {
      cSpy();
      return get(b) * 2;
    });

    c.get();
    c.get();
    expect(bSpy).toHaveBeenCalledTimes(1);
    expect(cSpy).toHaveBeenCalledTimes(1);

    a.set(2);
    expect(bSpy).toHaveBeenCalledTimes(1);
    expect(cSpy).toHaveBeenCalledTimes(1);

    b.subscribe(() => {});
    expect(bSpy).toHaveBeenCalledTimes(2);
    expect(cSpy).toHaveBeenCalledTimes(1);

    a.set(3);
    expect(bSpy).toHaveBeenCalledTimes(3);
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  it('does not recalc a dependant if it is not active (case 3)', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = atom(1);

    const b = computed((get) => {
      bSpy();
      return get(a) * 2;
    });

    const c = computed((get) => {
      cSpy();
      return get(b) * 2;
    });

    c.get();
    c.get();
    a.set(0);
    c.get();

    expect(bSpy).toHaveBeenCalledTimes(2);
    expect(cSpy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(bSpy).toHaveBeenCalledTimes(2);
    expect(cSpy).toHaveBeenCalledTimes(2);

    b.subscribe(() => {});
    expect(bSpy).toHaveBeenCalledTimes(3);
    expect(cSpy).toHaveBeenCalledTimes(2);

    a.set(3);
    expect(bSpy).toHaveBeenCalledTimes(4);
    expect(cSpy).toHaveBeenCalledTimes(2);
  });

  it('updates a dependent value after multiple dependency recalculations', () => {
    const a = atom(0);
    const b = computed((get) => get(a));

    expect(b.get()).toBe(0);

    a.set(1);
    a.get();
    a.set(1);
    a.get();

    expect(b.get()).toBe(1);
  });

  it('updates a dependent value after forced dependency update', () => {
    const a = atom(0);
    const b = computed((get) => get(a));
    const c = computed((get) => get(b));
    const d = computed((get) => get(b));

    c.get();
    d.subscribe(() => {});

    a.set(1);
    a.update();

    expect(c.get()).toBe(1);
  });

  it('does not make redundant computations on pulling', () => {
    const spy = jest.fn();

    const a = atom(0);
    const b = atom(0);

    const c = computed((get) => {
      spy();
      return get(a);
    });

    expect(spy).toHaveBeenCalledTimes(0);

    c.get();
    expect(spy).toHaveBeenCalledTimes(1);

    c.get();
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    c.get();
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(1);
    c.get();
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(2);
    c.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not make redundant computations on pulling (case 2)', () => {
    const spy = jest.fn(() => 0);

    const a0 = atom(0);
    const a1 = atom(0);
    const a2 = atom(0);
    const a3 = atom(0);

    const b0 = computed((get) => spy() + get(a0) + get(a1));
    const b1 = computed((get) => spy() + get(a1) + get(a2));
    const b2 = computed((get) => spy() + get(a2) + get(a3));

    const c0 = computed((get) => spy() + get(b0) + get(b1));
    const c1 = computed((get) => spy() + get(b1) + get(b2));

    c1.get();
    expect(spy).toHaveBeenCalledTimes(3);

    a0.set(1);
    c1.get();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not make redundant computations on scheduled run', () => {
    const spy = jest.fn();

    const a = atom(0);
    const b = atom(0);
    const c = computed((get) => {
      spy();
      return get(a);
    });
    const d = computed((get) => get(c) + get(b));

    d.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('notifies intermidiate store subscribers', () => {
    const count = atom(0);
    const x2Count = computed((get) => get(count) * 2);
    const sum = computed((get) => get(count) + get(x2Count));

    const subSum = jest.fn();
    const subX2Xount = jest.fn();

    sum.subscribe(subSum);
    x2Count.subscribe(subX2Xount);

    expect(subX2Xount).toHaveBeenCalledTimes(1);

    count.set(1);
    expect(subX2Xount).toHaveBeenCalledTimes(2);
  });

  it('passes exceptions down to dependants', () => {
    const obj = atom({
      a: 1,
    } as any);
    const num = atom(1);
    const objNum = computed((get) => (get(obj) as any).a as number);
    const sum = computed((get) => get(num) + get(objNum));
    const x2Sum = computed((get) => get(sum) * 2);

    const subscriber = jest.fn();

    x2Sum.subscribe(subscriber);

    expect(sum.get()).toBe(2);
    expect(x2Sum.get()).toBe(4);

    batch(() => {
      obj.set(null);
      num.set(5);
    });

    expect(num.get()).toBe(5);
    expect(sum.get()).toBe(2);
    expect(x2Sum.get()).toBe(4);

    obj.set({ a: 5 });
    expect(sum.get()).toBe(10);
    expect(x2Sum.get()).toBe(20);
  });

  it('continues to trigger dependants after error eliminated', () => {
    let str = '';

    const tumbler = atom(false);
    const counter = atom(0);

    const x2Counter = computed((get) => {
      const res = get(counter) * 2;

      if (res > 5) throw new Error();

      return res;
    });

    const x4Counter = computed((get) => get(x2Counter) * 2);

    const text = computed((get) => {
      let res = 'OFF';
      if (get(tumbler)) res = `ON (${get(x4Counter)})`;

      return res;
    });

    text.subscribe((value) => {
      str = value;
    });

    expect(str).toBe('OFF');

    tumbler.set(true);
    expect(str).toBe('ON (0)');

    counter.set(5);
    expect(str).toBe('ON (0)');

    tumbler.set(false);
    expect(str).toBe('OFF');
  });

  it('notifies subscribers when computed recovers from an error with undefined', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const source = atom(0);
    const listener = jest.fn();

    const derived = computed((track) => {
      if (track(source) === 0) {
        throw new Error('Initial error');
      }

      return undefined;
    });

    derived.subscribe(listener);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();

    source.set(1);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toBe(undefined);
  });

  it('does not run subscribers if an exception occured', () => {
    const spy = jest.fn();

    const a = atom(0);
    const b = computed((get) => {
      if (get(a) === 0) throw 'ERROR';
      return get(a);
    });

    b.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(0);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not run subscribers if an exception occured (case 2)', () => {
    const subscriber = jest.fn();

    const counter = atom(0);

    const x2Counter = computed((get) => {
      if (get(counter) > 5) throw new Error();
      return get(counter) * 2;
    });

    const x4Counter = computed((get) => get(x2Counter) * 2);

    x4Counter.subscribe(subscriber, false);

    counter.set(1);
    expect(x4Counter.get()).toBe(4);
    expect(subscriber).toHaveBeenCalledTimes(1);

    counter.set(20);
    expect(x4Counter.get()).toBe(4);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('returns previous value if an exception occured', () => {
    const counter = atom(0);

    const x2Counter = computed((get) => {
      if (get(counter) > 5) throw new Error();
      return get(counter) * 2;
    });

    const x4Counter = computed((get) => get(x2Counter) * 2);

    expect(x4Counter.get()).toBe(0);

    counter.set(20);
    expect(x4Counter.get()).toBe(0);
  });

  it('prevents circular dependencies', () => {
    let counter = 0;

    const a = atom(0);

    const b: any = computed((get) => {
      if (!get(a)) return 0;

      const res = get(c);
      counter++;

      return res;
    });

    const c = computed((get) => {
      return get(b);
    });

    expect(c.get()).toBe(0);
    expect(counter).toBe(0);

    a.set(1);

    expect(c.get()).toBe(0);
    expect(counter).toBeLessThan(2);

    counter = 0;
    c.subscribe(() => {});

    a.set(10);

    expect(c.get()).toBe(0);
    expect(counter).toBeLessThan(2);
  });

  it('can update atoms in subscribers', () => {
    const counter = atom(0);
    const x2Counter = atom(0);

    counter.subscribe((value) => x2Counter.set(value * 2));

    counter.set(1);

    expect(x2Counter.get()).toBe(2);
  });

  it('can use actual store state in subscribers', () => {
    const counter = atom(0);
    const x2Counter = computed((get) => get(counter) * 2);

    x2Counter.subscribe(() => {});

    counter.subscribe((value) => {
      expect(value * 2).toBe(x2Counter.get());
    });

    counter.set(1);
  });

  it('batches updates using batch function', () => {
    const subscriber = jest.fn();
    const counter = atom(0);

    counter.subscribe(subscriber, false);

    batch(() => {
      counter.set(1);
      counter.set(2);
      counter.set(3);
    });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  // it('batches updates made inside actions', () => {
  //   const subscriber = jest.fn();
  //   const counter = atom(0);

  //   counter.subscribe(subscriber, false);

  //   const someAction = action(() => {
  //     counter.set(1);
  //     counter.set(2);
  //     counter.set(3);
  //   });

  //   someAction();

  //   expect(subscriber).toHaveBeenCalledTimes(1);
  // });

  it('batches updates in subscribers', () => {
    const a = atom(0);
    const b = atom(0);
    const c = atom(0);
    const d = computed((get) => get(b) + get(c));
    const spy = jest.fn();

    a.subscribe(() => b.set(b.get() + 1), false);
    a.subscribe(() => c.set(c.get() + 1), false);
    d.subscribe(spy, false);

    expect(spy).toHaveBeenCalledTimes(0);

    a.set(1);
    expect(d.get()).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('batches updates while subscribing', () => {
    const a = atom(0);
    const b = atom(0);
    const c = atom(0);
    const d = computed((get) => get(b) + get(c));
    const spy = jest.fn();

    d.subscribe(spy, false);

    a.subscribe(() => {
      b.set(1);
      c.set(1);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(2, 0);
  });

  it('does not get stale writable atom value in subscribers', () => {
    const counter = atom(0);
    const event = atom();

    let value: any;

    event.subscribe(() => {
      counter.set(1);
      value = counter.get();
    }, false);

    event.update();

    expect(value).toBe(1);
  });

  it('does not get stale computed atom value in subscribers', () => {
    const counter = atom(0);
    const x2Counter = computed((get) => get(counter) * 2);
    const event = atom();

    let value: any;

    x2Counter.subscribe(() => {});

    event.subscribe(() => {
      counter.set(1);
      value = x2Counter.get();
    }, false);

    event.update();

    expect(value).toBe(2);
  });

  it('does not get stale atom value in subscribers after multiple updates', () => {
    const counter = atom(0);
    const x2Counter = computed((get) => get(counter) * 2);
    const x4Counter = computed((get) => get(x2Counter) * 2);
    const x5Counter = computed((get) => get(counter) * 5);

    const bigCounter = atom(100);
    const x2BigCounter = computed((get) => get(bigCounter) * 2);

    const event = atom();

    const logs: number[] = [];

    x5Counter.subscribe((value) => {
      bigCounter.set(300);
      logs.push(value);
    }, false);

    x2BigCounter.subscribe((value) => {
      logs.push(value);
    }, false);

    event.subscribe(() => {
      counter.set(2);
      bigCounter.set(200);

      logs.push(bigCounter.get());
      logs.push(x4Counter.get());

      counter.set(3);

      logs.push(x4Counter.get());
    }, false);

    event.update();

    expect(logs).toEqual([200, 8, 12, 15, 600]);
  });

  it('does not miss subscriber if the value was updated in another subscriber', () => {
    const a = atom(0);
    const b = atom(0);
    const bComputed = computed((get) => get(b));
    const spy = jest.fn();

    bComputed.subscribe(spy, false);

    a.subscribe(() => {
      b.set(1);
      bComputed.get();
      b.set(2);
      bComputed.get();
    }, false);

    a.set(1);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(2, 0);
  });

  it('does not make redundant subscriber run if the value was updated in another subscriber', () => {
    const a = atom(0);
    const b = atom(0);
    const c = atom(0);
    const d = atom(0);

    const logs: string[] = [];

    a.subscribe((v) => {
      b.set(v);
      logs.push('a ' + v);
    });

    b.subscribe((v) => {
      logs.push('b ' + v);
    });

    c.subscribe((v) => {
      logs.push('c ' + v);
    });

    d.subscribe((v) => {
      logs.push('d ' + v);
    });

    batch(() => {
      a.set(1);
      d.set(1);
      c.set(1);
      b.set(1000);
    });

    expect(logs).toEqual([
      'a 0',
      'b 0',
      'c 0',
      'd 0',
      'a 1',
      'd 1',
      'c 1',
      'b 1',
    ]);
  });

  it('catches and logs exceptions in subscribers', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const a = atom(0);
    const sub = () => {
      throw 'ERROR';
    };

    a.subscribe(sub);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    configure();
  });

  // describe('lifecycle hooks', () => {
  //   it('emits in right order', () => {
  //     const result: any = {};
  //     let order = 0;

  //     const counter = atom(0, {
  //       onActivate: () => (result.activate = ++order),
  //       onDeactivate: () => (result.deactivate = ++order),
  //       onUpdate: () => (result.update = ++order),
  //     });

  //     const unsub = counter.subscribe(() => {});
  //     counter.set(1);
  //     unsub();

  //     expect(result.activate).toBe(1);
  //     expect(result.update).toBe(2);
  //     expect(result.deactivate).toBe(3);
  //   });
  // });

  // describe('onActivate option', () => {
  //   it('sets atom activation listener', () => {
  //     let value: any;
  //     let unsub: any;

  //     const listener = jest.fn((v) => (value = v));

  //     const counter = atom(0, {
  //       onActivate(v) {
  //         listener(v);
  //       },
  //     });

  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = counter.subscribe(() => {});
  //     expect(value).toBe(0);
  //     expect(listener).toHaveBeenCalledTimes(1);

  //     counter.set(1);
  //     expect(value).toBe(0);
  //     expect(listener).toHaveBeenCalledTimes(1);

  //     unsub();
  //     expect(value).toBe(0);
  //     expect(listener).toHaveBeenCalledTimes(1);
  //   });

  //   it('correctly reacts to activation of previously calculated atom', () => {
  //     const spy = jest.fn();

  //     const a = atom(0, {
  //       onActivate: () => spy(),
  //     });
  //     const b = computed((get) => get(a) * 2);
  //     const c = computed((get) => get(b) * 2);
  //     const d = computed((get) => get(c) * 2);

  //     d.get();
  //     d.subscribe(() => {});

  //     expect(spy).toHaveBeenCalledTimes(1);
  //   });

  //   it('correctly reacts to activation of new dependency', () => {
  //     const spy = jest.fn();

  //     const a = atom(0);
  //     const b = atom(1, { onActivate: () => spy() });
  //     const c = computed((get) => get(a) && get(b));
  //     const d = computed((get) => get(c));

  //     d.subscribe(() => {});

  //     expect(spy).toHaveBeenCalledTimes(0);

  //     a.set(1);

  //     expect(spy).toHaveBeenCalledTimes(1);
  //   });

  //   it('keeps subscribtions made inside the function on parent recalculation', () => {
  //     const spy = jest.fn();
  //     const a = atom(0);
  //     const b = atom(0, {
  //       onActivate() {
  //         a.subscribe(spy);
  //       },
  //     });
  //     const c = computed((get) => get(b));

  //     c.subscribe(() => {});
  //     expect(spy).toHaveBeenCalledTimes(1);

  //     a.set(1);
  //     expect(spy).toHaveBeenCalledTimes(2);

  //     b.set(1);
  //     expect(spy).toHaveBeenCalledTimes(2);

  //     a.set(2);
  //     expect(spy).toHaveBeenCalledTimes(3);
  //   });
  // });

  // describe('onDeactivate option', () => {
  //   it('sets atom deactivation listener', () => {
  //     let value: any;
  //     let unsub: any;

  //     const listener = jest.fn((v) => (value = v));
  //     const counter = atom(0, { onDeactivate: (v) => listener(v) });

  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = counter.subscribe(() => {});
  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     counter.set(1);
  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub();
  //     expect(value).toBe(1);
  //     expect(listener).toHaveBeenCalledTimes(1);
  //     expect(listener).toHaveBeenCalledWith(1);
  //   });

  //   it('correctly reacts to deactivation of dependency', () => {
  //     const spy = jest.fn();

  //     const a = atom(1);
  //     const b = atom(1, { onDeactivate: () => spy() });
  //     const c = computed((get) => get(a) && get(b));
  //     const d = computed((get) => get(c));

  //     d.subscribe(() => {});

  //     expect(spy).toHaveBeenCalledTimes(0);

  //     a.set(0);
  //     expect(spy).toHaveBeenCalledTimes(1);
  //   });

  //   it('is not triggered if dependency reappears during same calculation cycle', () => {
  //     const onDeactivate = jest.fn();

  //     const a = atom(1);
  //     const b = atom(1, { onDeactivate });
  //     const c = computed((get) => (get(a) ? get(b) + get(a) : get(a) + get(b)));

  //     c.subscribe(() => {});

  //     expect(onDeactivate).toHaveBeenCalledTimes(0);

  //     a.set(0);
  //     a.set(1);

  //     expect(onDeactivate).toHaveBeenCalledTimes(0);
  //   });

  //   it('can be overriden by the return value of onActivate option', () => {
  //     const onDeactivate = jest.fn();
  //     const onDeactivateOverride = jest.fn();

  //     const a = atom(0, {
  //       onActivate() {
  //         return onDeactivateOverride;
  //       },
  //       onDeactivate,
  //     });

  //     const unsub = a.subscribe(() => {});

  //     expect(onDeactivate).toHaveBeenCalledTimes(0);
  //     expect(onDeactivateOverride).toHaveBeenCalledTimes(0);

  //     a.set(1);
  //     unsub();

  //     expect(onDeactivate).toHaveBeenCalledTimes(0);
  //     expect(onDeactivateOverride).toHaveBeenCalledTimes(1);
  //     expect(onDeactivateOverride).toHaveBeenLastCalledWith(1);
  //   });
  // });

  // describe('onCreate option', () => {
  //   it('emits at the moment the atom is created', () => {
  //     const writableSpy = jest.fn((arg) => {});
  //     const computedSpy = jest.fn((arg) => {});

  //     const a = atom(0, { onCreate: writableSpy });
  //     expect(writableSpy).toHaveBeenCalledWith(0);

  //     const b = computed((get) => {}, { onCreate: computedSpy });
  //     expect(computedSpy).toHaveBeenCalledWith(NONE);
  //   });
  // });

  // describe('onUpdate option', () => {
  //   it('sets atom update listener', () => {
  //     let res: any = {};
  //     let unsub: any;

  //     const listener = jest.fn((v, p) => {
  //       res.get() = v;
  //       res.prevValue = p;
  //     });

  //     const counter = atom(0, {
  //       onUpdate: (v, p) => listener(v, p),
  //     });

  //     expect(res.get()).toBeUndefined();
  //     expect(res.prevValue).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = counter.subscribe(() => {});
  //     expect(res.get()).toBeUndefined();
  //     expect(res.prevValue).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     counter.set(1);
  //     expect(res.get()).toBe(1);
  //     expect(res.prevValue).toBe(0);
  //     expect(listener).toHaveBeenCalledTimes(1);

  //     unsub();
  //     expect(res.get()).toBe(1);
  //     expect(res.prevValue).toBe(0);
  //     expect(listener).toHaveBeenCalledTimes(1);
  //   });
  // });

  // describe('onCleanup option', () => {
  //   it('triggers before every computation of the atom value', () => {
  //     let res: any = {};
  //     let unsub: any;

  //     const listener = jest.fn((v) => {
  //       res.get() = v;
  //     });

  //     const counter = atom(0);
  //     const computedCounter = computed((get) => get(counter), {
  //       onCleanup: listener,
  //     });

  //     expect(res.get()).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = computedCounter.subscribe(() => {});
  //     expect(res.get()).toBe(NONE);
  //     expect(listener).toHaveBeenCalledTimes(1);

  //     counter.set(1);
  //     expect(res.get()).toBe(0);
  //     expect(listener).toHaveBeenCalledTimes(2);

  //     unsub();
  //     expect(res.get()).toBe(1);
  //     expect(listener).toHaveBeenCalledTimes(3);
  //   });

  //   it('triggers on the atom deactivation', () => {
  //     let value: any;
  //     let unsub: any;

  //     const listener = jest.fn((v) => (value = v));
  //     const counter = atom(0, { onCleanup: (v) => listener(v) });

  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = counter.subscribe(() => {});
  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     counter.set(1);
  //     expect(value).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub();
  //     expect(value).toBe(1);
  //     expect(listener).toHaveBeenCalledTimes(1);
  //   });

  //   it('correctly reacts to deactivation of dependency', () => {
  //     const spy = jest.fn();

  //     const a = atom(1);
  //     const b = atom(1, { onCleanup: () => spy() });
  //     const c = computed((get) => get(a) && get(b));
  //     const d = computed((get) => get(c));

  //     d.subscribe(() => {});

  //     expect(spy).toHaveBeenCalledTimes(0);

  //     a.set(0);
  //     expect(spy).toHaveBeenCalledTimes(1);
  //   });

  //   it('is not triggered if dependency reappears during same calculation cycle', () => {
  //     const onCleanup = jest.fn();

  //     const a = atom(1);
  //     const b = atom(1, { onCleanup });
  //     const c = computed((get) => (get(a) ? get(b) + get(a) : get(a) + get(b)));

  //     c.subscribe(() => {});

  //     expect(onCleanup).toHaveBeenCalledTimes(0);

  //     a.set(0);
  //     a.set(1);

  //     expect(onCleanup).toHaveBeenCalledTimes(0);
  //   });
  // });

  // describe('onException option', () => {
  //   it('sets atom exception listener', () => {
  //     configure({
  //       logException: () => {},
  //     });

  //     const listener = jest.fn((e, v) => {
  //       error = e;
  //       lastValue = v;
  //     });

  //     let error: any;
  //     let lastValue: any;
  //     let unsub: any;

  //     const counter = atom(0);
  //     const x2Counter = atom(
  //       (get) => {
  //         if (get(counter) > 4) throw 'error';
  //         return get(counter) * 2;
  //       },
  //       {
  //         onException: (e, v) => listener(e, v),
  //       }
  //     );

  //     expect(error).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = x2Counter.subscribe(() => {});
  //     expect(error).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     counter.set(2);
  //     expect(error).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);
  //     expect(lastValue).toBeUndefined();

  //     counter.set(5);
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(1);
  //     expect(lastValue).toBe(4);

  //     counter.set(6);
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(2);
  //     expect(lastValue).toBe(4);

  //     counter.set(3);
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(2);
  //     expect(lastValue).toBe(4);

  //     unsub();
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(2);
  //     expect(lastValue).toBe(4);

  //     configure();
  //   });

  //   it('correctly reacts to exceptions in intermideate atoms', () => {
  //     configure({
  //       logException: () => {},
  //     });

  //     const listener = jest.fn((v) => (error = v));

  //     let error: any;
  //     let unsub: any;

  //     const counter = atom(0);
  //     const x2Counter = computed((get) => {
  //       if (get(counter) > 4) throw 'error';
  //       return get(counter) * 2;
  //     });
  //     const x4Counter = computed((get) => get(x2Counter) * 2, {
  //       onException: (v) => listener(v),
  //     });

  //     expect(error).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     unsub = x4Counter.subscribe(() => {});
  //     expect(error).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     counter.set(2);
  //     expect(error).toBeUndefined();
  //     expect(listener).toHaveBeenCalledTimes(0);

  //     counter.set(5);
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(1);

  //     counter.set(6);
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(2);

  //     counter.set(3);
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(2);

  //     unsub();
  //     expect(error).toBe('error');
  //     expect(listener).toHaveBeenCalledTimes(2);

  //     configure();
  //   });
  // });

  // describe('name option', () => {
  //   it('can be set using the name property of atom options and accessed via this', () => {
  //     const spy = jest.fn((str) => {});

  //     const a = atom(0, {
  //       name: 'test',
  //       onUpdate() {
  //         spy(this.name);
  //       },
  //     });

  //     a.set(1);
  //     a.get();

  //     expect(spy).toHaveBeenLastCalledWith('test');
  //   });
  // });

  // describe('atom options', () => {
  //   it('allows to handle activation and deactivation of atoms', () => {
  //     const activateSpy = jest.fn();
  //     const deactivateSpy = jest.fn();

  //     const a = atom(0);
  //     const b = atom(0);
  //     const c = atom(0);
  //     const d = atom(0);

  //     const a1 = computed((get) => get(a));
  //     const b1 = computed((get) => get(b), {
  //       onActivate: activateSpy,
  //       onDeactivate: deactivateSpy,
  //     });
  //     const c1 = computed((get) => get(c));
  //     const d1 = computed((get) => get(d));

  //     const a2 = computed((get) => get(a1));
  //     const b2 = computed((get) => get(b1));
  //     const c2 = computed((get) => get(c1));
  //     const d2 = computed((get) => get(d1));

  //     const res = computed((get) => {
  //       return get(a2) < 10 ? get(b2) + get(c2) + get(d2) : get(d2) + get(c2);
  //     });

  //     const unsub = res.subscribe(() => {});
  //     expect(activateSpy).toHaveBeenCalledTimes(1);
  //     expect(deactivateSpy).toHaveBeenCalledTimes(0);

  //     a.set(1);
  //     expect(activateSpy).toHaveBeenCalledTimes(1);
  //     expect(deactivateSpy).toHaveBeenCalledTimes(0);

  //     b.set(1);
  //     expect(activateSpy).toHaveBeenCalledTimes(1);
  //     expect(deactivateSpy).toHaveBeenCalledTimes(0);

  //     a.set(10);
  //     expect(activateSpy).toHaveBeenCalledTimes(1);
  //     expect(deactivateSpy).toHaveBeenCalledTimes(1);

  //     a.set(5);
  //     expect(activateSpy).toHaveBeenCalledTimes(2);
  //     expect(deactivateSpy).toHaveBeenCalledTimes(1);

  //     unsub();
  //     expect(activateSpy).toHaveBeenCalledTimes(2);
  //     expect(deactivateSpy).toHaveBeenCalledTimes(2);
  //   });

  //   it('allows to setup async chains of computations', () => {
  //     let res: any;

  //     const spy = jest.fn((value) => {
  //       res = value;
  //     });

  //     const url = atom('foo');
  //     const fetched = async((get: any, resolve: any) => {
  //       const value = get(url);
  //       resolve(value);
  //     });

  //     fetched.subscribe(spy);
  //     expect(res).toBeDefined();
  //     expect(res.data).toBe('foo');
  //     expect(spy).toHaveBeenCalledTimes(2);

  //     url.set('bar');
  //     expect(res.data).toBe('bar');
  //     expect(spy).toHaveBeenCalledTimes(3);
  //   });

  //   it('allows to setup async chains of computations (case 2)', () => {
  //     let res: any;

  //     const spy = jest.fn((value) => {
  //       res = value;
  //     });

  //     const url = atom('foo');
  //     const fetched = async((get: any, resolve: any) => {
  //       const value = get(url);
  //       resolve(value);
  //     });
  //     const fetchedComp = computed((get) => {
  //       return get(fetched);
  //     });

  //     fetchedComp.subscribe(spy);
  //     expect(res).toBeDefined();
  //     expect(res.data).toBe('foo');
  //     expect(spy).toHaveBeenCalledTimes(2);

  //     url.set('bar');
  //     expect(res.data).toBe('bar');
  //     expect(spy).toHaveBeenCalledTimes(3);
  //   });

  //   it('allows to setup async chains of computations (case 3)', () => {
  //     let res: any;

  //     const spy = jest.fn((value) => {
  //       res = value;
  //     });

  //     const url = atom('foo');
  //     const fetched = async((get: any, resolve: any) => {
  //       const value = get(url);
  //       resolve(value);
  //     });
  //     const fetchedComp = computed((get) => {
  //       return get(fetched);
  //     });
  //     const fetchedDeepComp = computed((get) => {
  //       return get(fetchedComp);
  //     });

  //     fetchedDeepComp.subscribe(spy);
  //     expect(res).toBeDefined();
  //     expect(res.data).toBe('foo');
  //     expect(spy).toHaveBeenCalledTimes(2);

  //     url.set('bar');
  //     expect(res.data).toBe('bar');
  //     expect(spy).toHaveBeenCalledTimes(3);
  //   });
  // });
});
