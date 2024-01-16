import { computed } from '../computed/computed';
import { writable, WritableSignal } from '../writable/writable';
import { configure } from '../config/config';
import { batch } from '../core/core';

describe('signal', () => {
  configure({
    logException: () => {},
  });

  const counter = writable(0);
  let unsubs: (() => any)[] = [];
  let num: number;
  let x2Num: number;

  const subscriber = jest.fn((value: number) => {
    num = value;
  });

  const altSubscriber = jest.fn((value: number) => (x2Num = value * 2));

  it('runs subscribers on subscribe', () => {
    unsubs.push(counter.subscribe(subscriber));
    counter.subscribe(altSubscriber);

    expect(subscriber).toBeCalled();
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
  });

  it('correctly handles multiple unsubscribing', () => {
    const x2Counter = computed(() => 2 * counter());
    const x2Unsub = x2Counter.subscribe(() => {});

    expect(x2Counter()).toBe(6);

    x2Unsub();
    x2Unsub();

    counter.set(4);
    expect(x2Counter()).toBe(8);
  });

  it('does not track itself on subscribing', () => {
    const counter = writable(0);
    const gt5 = computed(() => counter() > 5);
    const res = computed(() => {
      if (gt5()) {
        const obj: any = {};

        counter.subscribe((v) => (obj.value = v));
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

    expect(spy).toBeCalledTimes(1);
  });

  it('does not track dependencies inside subscriber function', () => {
    const counter = writable(0);
    const gt5 = computed(() => counter() > 5);
    const res = computed(() => {
      if (gt5()) {
        const obj: any = {};

        counter.subscribe((v) => (obj.value = counter()));
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

    expect(spy).toBeCalledTimes(1);
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

    const a = writable(0);
    const b = computed(() => a() * 2);
    const c = computed(() => a() * 2);
    const d = computed(() => c() * 2);
    const e = computed(() => b() + d());

    const subscriber = jest.fn();

    e.subscribe(subscriber, false);

    a.set(1);

    expect(e()).toBe(6);
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

    const a = writable(0);
    const b = computed(() => a() * 2);
    const c = computed(() => b() * 2);
    const d = computed(() => c() + b());

    const subscriber = jest.fn();

    d.subscribe(subscriber, false);

    a.set(1);

    expect(d()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('dynamically updates dependencies', () => {
    const counter = writable(0);
    const tumbler = writable(false);
    const x2Counter = computed(() => counter() * 2);
    const result = computed(() => (tumbler() ? x2Counter() : 'FALSE'));

    const subscriber = jest.fn();

    result.subscribe(subscriber, false);

    expect(result()).toBe('FALSE');

    counter.set(1);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(0);

    batch(() => {
      tumbler.set(true);
      counter.set(2);
    });

    expect(result()).toBe(4);
    expect(subscriber).toBeCalledTimes(1);

    tumbler.set(false);
    counter.set(3);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(2);

    counter.set(4);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(2);

    tumbler.set(true);
    expect(result()).toBe(8);
    expect(subscriber).toBeCalledTimes(3);

    counter.set(5);
    expect(result()).toBe(10);
    expect(subscriber).toBeCalledTimes(4);

    counter.set(6);
    expect(result()).toBe(12);
    expect(subscriber).toBeCalledTimes(5);
  });

  it('dynamically updates dependencies (case 2)', () => {
    const tumbler = writable(true);
    const a = writable('a');
    const b = writable('b');

    const sum = computed(() => {
      if (tumbler()) return a() + b();
      return b() + a();
    });

    const subSum = jest.fn();

    sum.subscribe(subSum);

    expect(subSum).toBeCalledTimes(1);

    tumbler.set(false);
    expect(subSum).toBeCalledTimes(2);

    tumbler.set(true);
    expect(subSum).toBeCalledTimes(3);
  });

  it('dynamically updates dependencies (case 3)', () => {
    const spy = jest.fn();
    const a = writable(11);
    const b = writable(2);
    const bComp = computed(() => {
      spy();
      return b();
    });

    const value = computed(() => {
      if (a() > 10) return bComp() + bComp() + bComp();
      return a();
    });

    value.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    a.set(1);
    expect(spy).toBeCalledTimes(1);

    b.set(2);
    b.set(3);
    b.set(4);
    b.set(5);
    expect(spy).toBeCalledTimes(1);
  });

  it('dynamically updates dependencies (case 4)', () => {
    let res = '';

    const fib: (n: number) => number = (n: number) =>
      n < 2 ? 1 : fib(n - 1) + fib(n - 2);

    const hard = (n: number, l: string) => {
      res += l;
      return n + fib(16);
    };

    const A = writable(0);
    const B = writable(0);
    const C = computed(() => (A() % 2) + (B() % 2));
    const D = computed(() => (A() % 2) - (B() % 2));
    const E = computed(() => hard(C() + A() + D(), 'E'));
    const F = computed(() => hard(D() && B(), 'F'));
    const G = computed(() => C() + (C() || E() % 2) + D() + F());
    const H = G.subscribe((v) => hard(v, 'H'));
    const I = G.subscribe(() => {});
    const J = F.subscribe((v) => hard(v, 'J'));

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
  });

  it('does not recalc a dependant if it is not active', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = writable(1);

    const b = computed(() => {
      bSpy();
      return a() * 2;
    });

    const c = computed(() => {
      cSpy();
      return b() * 2;
    });

    c();
    expect(bSpy).toBeCalledTimes(1);
    expect(cSpy).toBeCalledTimes(1);

    a.set(2);
    expect(bSpy).toBeCalledTimes(1);
    expect(cSpy).toBeCalledTimes(1);

    b.subscribe(() => {});
    expect(bSpy).toBeCalledTimes(2);
    expect(cSpy).toBeCalledTimes(1);

    a.set(3);
    expect(bSpy).toBeCalledTimes(3);
    expect(cSpy).toBeCalledTimes(1);
  });

  it('does not recalc a dependant if it is not active (case 2)', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = writable(1);

    const b = computed(() => {
      bSpy();
      return a() * 2;
    });

    const c = computed(() => {
      cSpy();
      return b() * 2;
    });

    c();
    c();
    expect(bSpy).toBeCalledTimes(1);
    expect(cSpy).toBeCalledTimes(1);

    a.set(2);
    expect(bSpy).toBeCalledTimes(1);
    expect(cSpy).toBeCalledTimes(1);

    b.subscribe(() => {});
    expect(bSpy).toBeCalledTimes(2);
    expect(cSpy).toBeCalledTimes(1);

    a.set(3);
    expect(bSpy).toBeCalledTimes(3);
    expect(cSpy).toBeCalledTimes(1);
  });

  it('does not recalc a dependant if it is not active (case 3)', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = writable(1);

    const b = computed(() => {
      bSpy();
      return a() * 2;
    });

    const c = computed(() => {
      cSpy();
      return b() * 2;
    });

    c();
    c();
    a.set(0);
    c();

    expect(bSpy).toBeCalledTimes(2);
    expect(cSpy).toBeCalledTimes(2);

    a.set(2);
    expect(bSpy).toBeCalledTimes(2);
    expect(cSpy).toBeCalledTimes(2);

    b.subscribe(() => {});
    expect(bSpy).toBeCalledTimes(3);
    expect(cSpy).toBeCalledTimes(2);

    a.set(3);
    expect(bSpy).toBeCalledTimes(4);
    expect(cSpy).toBeCalledTimes(2);
  });

  it('does not make redundant computations on scheduled run', () => {
    const spy = jest.fn();

    const a = writable(0);
    const b = writable(0);
    const c = computed(() => {
      spy();
      return a();
    });
    const d = computed(() => c() + b());

    d.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    b.set(1);
    expect(spy).toBeCalledTimes(1);
  });

  it('notifies intermidiate computed subscribers', () => {
    const count = writable(0);
    const x2Count = computed(() => count() * 2);
    const sum = computed(() => count() + x2Count());

    const subSum = jest.fn();
    const subX2Xount = jest.fn();

    sum.subscribe(subSum);
    x2Count.subscribe(subX2Xount);

    expect(subX2Xount).toBeCalledTimes(1);

    count.set(1);
    expect(subX2Xount).toBeCalledTimes(2);
  });

  it('passes exceptions down to dependants', () => {
    const obj: WritableSignal<{ a: number } | null> = writable({
      a: 1,
    } as any);
    const num = writable(1);
    const objNum = computed(() => (obj() as any).a as number);
    const sum = computed(() => num() + objNum());
    const x2Sum = computed(() => sum() * 2);

    const subscriber = jest.fn();

    x2Sum.subscribe(subscriber);

    expect(sum()).toBe(2);
    expect(x2Sum()).toBe(4);

    batch(() => {
      obj.set(null);
      num.set(5);
    });

    expect(num()).toBe(5);
    expect(sum()).toBe(2);
    expect(x2Sum()).toBe(4);

    obj.set({ a: 5 });
    expect(sum()).toBe(10);
    expect(x2Sum()).toBe(20);
  });

  it('continues to trigger dependants after error eliminated', () => {
    let str = '';

    const tumbler = writable(false);
    const counter = writable(0);

    const x2Counter = computed(() => {
      const res = counter() * 2;

      if (res > 5) throw new Error();

      return res;
    });

    const x4Counter = computed(() => x2Counter() * 2);

    const text = computed(() => {
      let res = 'OFF';
      if (tumbler()) res = `ON (${x4Counter()})`;

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

  it('has get method which returns current value', () => {
    const test = writable(0);

    expect(test.get()).toBe(0);
    expect(test.get()).toBe(test());
  });

  it('returns previous value if an exception occured', () => {
    const counter = writable(0);

    const x2Counter = computed(() => {
      if (counter() > 5) throw new Error();
      return counter() * 2;
    });

    const x4Counter = computed(() => x2Counter() * 2);

    expect(x4Counter()).toBe(0);

    counter.set(20);
    expect(x4Counter()).toBe(0);
  });

  it('does not run subscribers if an exception occured', () => {
    const subscriber = jest.fn();

    const counter = writable(0);

    const x2Counter = computed(() => {
      if (counter() > 5) throw new Error();
      return counter() * 2;
    });

    const x4Counter = computed(() => x2Counter() * 2);

    x4Counter.subscribe(subscriber, false);

    counter.set(1);
    expect(x4Counter()).toBe(4);
    expect(subscriber).toBeCalledTimes(1);

    counter.set(20);
    expect(x4Counter()).toBe(4);
    expect(subscriber).toBeCalledTimes(1);
  });

  it('prevents circular dependencies', () => {
    let counter = 0;

    const a = writable(0);

    const b: any = computed(() => {
      if (!a()) return 0;

      const res = c();
      counter++;

      return res;
    });

    const c = computed(() => {
      return b();
    });

    expect(c()).toBe(0);
    expect(counter).toBe(0);

    a.set(1);

    expect(c()).toBe(0);
    expect(counter).toBeLessThan(2);

    counter = 0;
    c.subscribe(() => {});

    a.set(10);

    expect(c()).toBe(0);
    expect(counter).toBeLessThan(2);
  });

  it('can update writables in subscribers', () => {
    const counter = writable(0);
    const x2Counter = writable(0);

    counter.subscribe((value) => x2Counter.set(value * 2));

    counter.set(1);

    expect(x2Counter()).toBe(2);
  });

  it('can use actual writable state in subscribers', () => {
    const counter = writable(0);
    const x2Counter = computed(() => counter() * 2);

    x2Counter.subscribe(() => {});

    counter.subscribe((value) => {
      expect(value * 2).toBe(x2Counter());
    });

    counter.set(1);
  });

  it('batches updates using batch function', () => {
    const subscriber = jest.fn();
    const counter = writable(0);

    counter.subscribe(subscriber, false);

    batch(() => {
      counter.set(1);
      counter.set(2);
      counter.set(3);
    });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('batches updates in subscribers', () => {
    const a = writable(0);
    const b = writable(0);
    const c = writable(0);
    const d = computed(() => b() + c());
    const spy = jest.fn();

    a.subscribe(() => b.set(b() + 1), false);
    a.subscribe(() => c.set(c() + 1), false);
    d.subscribe(spy, false);

    expect(spy).toBeCalledTimes(0);

    a.set(1);
    expect(d()).toBe(2);
    expect(spy).toBeCalledTimes(1);
  });

  describe('lifecycle hooks', () => {
    it('emits in right order', () => {
      const result: any = {};
      let order = 0;

      const counter = writable(0, {
        onActivate: () => (result.activate = ++order),
        onDeactivate: () => (result.deactivate = ++order),
        onUpdate: () => (result.update = ++order),
      });

      const unsub = counter.subscribe(() => {});
      counter.set(1);
      unsub();

      expect(result.activate).toBe(1);
      expect(result.update).toBe(2);
      expect(result.deactivate).toBe(3);
    });
  });

  describe('onActivate option', () => {
    it('sets signal activation listener', () => {
      let value: any;
      let unsub: any;

      const listener = jest.fn((v) => (value = v));

      const counter = writable(0, {
        onActivate(v) {
          listener(v);
        },
      });

      expect(value).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      unsub = counter.subscribe(() => {});
      expect(value).toBe(0);
      expect(listener).toBeCalledTimes(1);

      counter.set(1);
      expect(value).toBe(0);
      expect(listener).toBeCalledTimes(1);

      unsub();
      expect(value).toBe(0);
      expect(listener).toBeCalledTimes(1);
    });

    it('correctly reacts to activation of previously calculated signal', () => {
      const spy = jest.fn();

      const a = writable(0, {
        onActivate: () => spy(),
      });
      const b = computed(() => a() * 2);
      const c = computed(() => b() * 2);
      const d = computed(() => c() * 2);

      d();
      d.subscribe(() => {});

      expect(spy).toBeCalledTimes(1);
    });

    it('correctly reacts to activation of new dependency', () => {
      const spy = jest.fn();

      const a = writable(0);
      const b = writable(1, { onActivate: () => spy() });
      const c = computed(() => a() && b());
      const d = computed(() => c());

      d.subscribe(() => {});

      expect(spy).toBeCalledTimes(0);

      a.set(1);

      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('onDeactivate option', () => {
    it('sets signal deactivation listener', () => {
      let value: any;
      let unsub: any;

      const listener = jest.fn((v) => (value = v));
      const counter = writable(0, { onDeactivate: (v) => listener(v) });

      expect(value).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      unsub = counter.subscribe(() => {});
      expect(value).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      counter.set(1);
      expect(value).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      unsub();
      expect(value).toBe(1);
      expect(listener).toBeCalledTimes(1);
    });

    it('correctly reacts to deactivation of dependency', () => {
      const spy = jest.fn();

      const a = writable(1);
      const b = writable(1, { onDeactivate: () => spy() });
      const c = computed(() => a() && b());
      const d = computed(() => c());

      d.subscribe(() => {});

      expect(spy).toBeCalledTimes(0);

      a.set(0);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('onUpdate option', () => {
    it('sets signal update listener', () => {
      let res: any = {};
      let unsub: any;

      const listener = jest.fn((v, p) => {
        res.value = v;
        res.prevValue = p;
      });

      const counter = writable(0, {
        onUpdate: (v, p) => listener(v, p),
      });

      expect(res.value).toBeUndefined();
      expect(res.prevValue).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      unsub = counter.subscribe(() => {});
      expect(res.value).toBeUndefined();
      expect(res.prevValue).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      counter.set(1);
      expect(res.value).toBe(1);
      expect(res.prevValue).toBe(0);
      expect(listener).toBeCalledTimes(1);

      unsub();
      expect(res.value).toBe(1);
      expect(res.prevValue).toBe(0);
      expect(listener).toBeCalledTimes(1);
    });
  });

  describe('onException option', () => {
    it('sets signal exception listener', () => {
      configure({
        logException: () => {},
      });

      const listener = jest.fn((v) => (error = v));

      let error: any;
      let unsub: any;

      const counter = writable(0);
      const x2Counter = computed(
        () => {
          if (counter() > 4) throw 'error';
          return counter() * 2;
        },
        {
          onException: (v) => listener(v),
        },
      );

      expect(error).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      unsub = x2Counter.subscribe(() => {});
      expect(error).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      counter.set(2);
      expect(error).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      counter.set(5);
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(1);

      counter.set(6);
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(2);

      counter.set(3);
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(2);

      unsub();
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(2);

      configure();
    });

    it('correctly reacts to exceptions in intermideate signals', () => {
      configure({
        logException: () => {},
      });

      const listener = jest.fn((v) => (error = v));

      let error: any;
      let unsub: any;

      const counter = writable(0);
      const x2Counter = computed(() => {
        if (counter() > 4) throw 'error';
        return counter() * 2;
      });
      const x4Counter = computed(() => x2Counter() * 2, {
        onException: (v) => listener(v),
      });

      expect(error).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      unsub = x4Counter.subscribe(() => {});
      expect(error).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      counter.set(2);
      expect(error).toBeUndefined();
      expect(listener).toBeCalledTimes(0);

      counter.set(5);
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(1);

      counter.set(6);
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(2);

      counter.set(3);
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(2);

      unsub();
      expect(error).toBe('error');
      expect(listener).toBeCalledTimes(2);

      configure();
    });
  });

  describe('signal options', () => {
    it('allow to handle activation and deactivation of signals', () => {
      const activateSpy = jest.fn();
      const deactivateSpy = jest.fn();

      const a = writable(0);
      const b = writable(0);
      const c = writable(0);
      const d = writable(0);

      const a1 = computed(() => a());
      const b1 = computed(() => b(), {
        onActivate: activateSpy,
        onDeactivate: deactivateSpy,
      });
      const c1 = computed(() => c());
      const d1 = computed(() => d());

      const a2 = computed(() => a1());
      const b2 = computed(() => b1());
      const c2 = computed(() => c1());
      const d2 = computed(() => d1());

      const res = computed(() => {
        return a2() < 10 ? b2() + c2() + d2() : d2() + c2();
      });

      const unsub = res.subscribe(() => {});
      expect(activateSpy).toHaveBeenCalledTimes(1);
      expect(deactivateSpy).toHaveBeenCalledTimes(0);

      a.set(1);
      expect(activateSpy).toHaveBeenCalledTimes(1);
      expect(deactivateSpy).toHaveBeenCalledTimes(0);

      b.set(1);
      expect(activateSpy).toHaveBeenCalledTimes(1);
      expect(deactivateSpy).toHaveBeenCalledTimes(0);

      a.set(10);
      expect(activateSpy).toHaveBeenCalledTimes(1);
      expect(deactivateSpy).toHaveBeenCalledTimes(1);

      a.set(5);
      expect(activateSpy).toHaveBeenCalledTimes(2);
      expect(deactivateSpy).toHaveBeenCalledTimes(1);

      unsub();
      expect(activateSpy).toHaveBeenCalledTimes(2);
      expect(deactivateSpy).toHaveBeenCalledTimes(2);
    });
  });
});
