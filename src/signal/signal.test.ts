import { signal } from './signal';
import { configure } from '../config/config';
import { batch } from '../core/core';

describe('signal', () => {
  configure({
    logException: () => {},
  });

  const counter = signal(0);
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

    unsubs.forEach((fn) => fn());
  });

  it('correctly handles subscribing and unsubscribing to a signal without dependencies', () => {
    const frozenSub = jest.fn();
    const onActivate = jest.fn();
    const onDeactivate = jest.fn();

    const frozen = signal((get) => 0, { onActivate, onDeactivate });

    const unsubFrozen = frozen.subscribe(frozenSub);
    expect(onDeactivate).toHaveBeenCalledTimes(0);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(frozenSub).toHaveBeenCalledTimes(1);

    unsubFrozen();
    expect(onDeactivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(frozenSub).toHaveBeenCalledTimes(1);
  });

  it('correctly handles multiple unsubscribing', () => {
    const x2Counter = signal((get) => 2 * get(counter));
    const x2Unsub = x2Counter.subscribe(() => {});

    expect(x2Counter.get()).toBe(6);

    x2Unsub();
    x2Unsub();

    counter.set(4);
    expect(x2Counter.get()).toBe(8);
  });

  it('does not track itself on subscribing', () => {
    const counter = signal(0);
    const gt5 = signal((get) => get(counter) > 5);
    const res = signal((get) => {
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
    const counter = signal(0);
    const gt5 = signal((get) => get(counter) > 5);
    const res = signal((get) => {
      if (get(gt5)) {
        const obj: any = {};

        counter.subscribe((v) => {
          obj.value = get(counter);
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

    const a = signal(0);
    const b = signal((get) => get(a) * 2);
    const c = signal((get) => get(a) * 2);
    const d = signal((get) => get(c) * 2);
    const e = signal((get) => get(b) + get(d));

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

    const a = signal(0);
    const b = signal((get) => get(a) * 2);
    const c = signal((get) => get(b) * 2);
    const d = signal((get) => get(c) + get(b));

    const subscriber = jest.fn();

    d.subscribe(subscriber, false);

    a.set(1);

    expect(d.get()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('dynamically updates dependencies', () => {
    const counter = signal(0);
    const tumbler = signal(false);
    const x2Counter = signal((get) => get(counter) * 2);
    const result = signal((get) => (get(tumbler) ? get(x2Counter) : 'FALSE'));

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
    const tumbler = signal(true);
    const a = signal('a');
    const b = signal('b');

    const sum = signal((get) => {
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
    const a = signal(11);
    const b = signal(2);
    const bComp = signal((get) => {
      spy();
      return get(b);
    });

    const value = signal((get) => {
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

    const A = signal(0);
    const B = signal(0);
    const C = signal((get) => (get(A) % 2) + (get(B) % 2));
    const D = signal((get) => (get(A) % 2) - (get(B) % 2));
    const E = signal((get) => hard(get(C) + get(A) + get(D), 'E'));
    const F = signal((get) => hard(get(D) && get(B), 'F'));
    const G = signal(
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
  });

  it('dynamically updates dependencies (case 5)', () => {
    const spy = jest.fn();

    const a = signal(0);
    const b = signal(0);
    const c = signal(0);

    const d = signal((get) => {
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

    const a = signal(0);
    const b = signal(0);
    const c = signal(0);

    const d = signal((get) => {
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

  it('does not recalc a dependant if it is not active', () => {
    const bSpy = jest.fn();
    const cSpy = jest.fn();

    const a = signal(1);

    const b = signal((get) => {
      bSpy();
      return get(a) * 2;
    });

    const c = signal((get) => {
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

    const a = signal(1);

    const b = signal((get) => {
      bSpy();
      return get(a) * 2;
    });

    const c = signal((get) => {
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

    const a = signal(1);

    const b = signal((get) => {
      bSpy();
      return get(a) * 2;
    });

    const c = signal((get) => {
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
    const a = signal(0);
    const b = signal((get) => get(a));

    expect(b.get()).toBe(0);

    a.set(1);
    a.get();
    a.set(1);
    a.get();

    expect(b.get()).toBe(1);
  });

  it('updates a dependent value after emitting a dependency', () => {
    const a = signal(0);
    const b = signal((get) => get(a));
    const c = signal((get) => get(b));
    const d = signal((get) => get(b));

    c.get();
    d.subscribe(() => {});

    a.set(1);
    a.emit(1);

    expect(c.get()).toBe(1);
  });

  it('does not make redundant computations on pulling', () => {
    const spy = jest.fn();

    const a = signal(0);
    const b = signal(0);

    const c = signal((get) => {
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

    const a0 = signal(0);
    const a1 = signal(0);
    const a2 = signal(0);
    const a3 = signal(0);

    const b0 = signal((get) => spy() + get(a0) + get(a1));
    const b1 = signal((get) => spy() + get(a1) + get(a2));
    const b2 = signal((get) => spy() + get(a2) + get(a3));

    const c0 = signal((get) => spy() + get(b0) + get(b1));
    const c1 = signal((get) => spy() + get(b1) + get(b2));

    c1.get();
    expect(spy).toHaveBeenCalledTimes(3);

    a0.set(1);
    c1.get();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not make redundant computations on scheduled run', () => {
    const spy = jest.fn();

    const a = signal(0);
    const b = signal(0);
    const c = signal((get) => {
      spy();
      return get(a);
    });
    const d = signal((get) => get(c) + get(b));

    d.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('notifies intermidiate signal subscribers', () => {
    const count = signal(0);
    const x2Count = signal((get) => get(count) * 2);
    const sum = signal((get) => get(count) + get(x2Count));

    const subSum = jest.fn();
    const subX2Xount = jest.fn();

    sum.subscribe(subSum);
    x2Count.subscribe(subX2Xount);

    expect(subX2Xount).toHaveBeenCalledTimes(1);

    count.set(1);
    expect(subX2Xount).toHaveBeenCalledTimes(2);
  });

  it('passes exceptions down to dependants', () => {
    const obj = signal({
      a: 1,
    } as any);
    const num = signal(1);
    const objNum = signal((get) => (get(obj) as any).a as number);
    const sum = signal((get) => get(num) + get(objNum));
    const x2Sum = signal((get) => get(sum) * 2);

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

    const tumbler = signal(false);
    const counter = signal(0);

    const x2Counter = signal((get) => {
      const res = get(counter) * 2;

      if (res > 5) throw new Error();

      return res;
    });

    const x4Counter = signal((get) => get(x2Counter) * 2);

    const text = signal((get) => {
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

  it('does not run subscribers if an exception occured', () => {
    const spy = jest.fn();

    const a = signal(0);
    const b = signal((get) => {
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

  it('has get method which returns current value', () => {
    const test = signal(0);

    expect(test.get()).toBe(0);
    expect(test.get()).toBe(test.get());
  });

  it('returns previous value if an exception occured', () => {
    const counter = signal(0);

    const x2Counter = signal((get) => {
      if (get(counter) > 5) throw new Error();
      return get(counter) * 2;
    });

    const x4Counter = signal((get) => get(x2Counter) * 2);

    expect(x4Counter.get()).toBe(0);

    counter.set(20);
    expect(x4Counter.get()).toBe(0);
  });

  it('does not run subscribers if an exception occured', () => {
    const subscriber = jest.fn();

    const counter = signal(0);

    const x2Counter = signal((get) => {
      if (get(counter) > 5) throw new Error();
      return get(counter) * 2;
    });

    const x4Counter = signal((get) => get(x2Counter) * 2);

    x4Counter.subscribe(subscriber, false);

    counter.set(1);
    expect(x4Counter.get()).toBe(4);
    expect(subscriber).toHaveBeenCalledTimes(1);

    counter.set(20);
    expect(x4Counter.get()).toBe(4);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('prevents circular dependencies', () => {
    let counter = 0;

    const a = signal(0);

    const b: any = signal((get) => {
      if (!get(a)) return 0;

      const res = get(c);
      counter++;

      return res;
    });

    const c = signal((get) => {
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

  it('can update signals in subscribers', () => {
    const counter = signal(0);
    const x2Counter = signal(0);

    counter.subscribe((value) => x2Counter.set(value * 2));

    counter.set(1);

    expect(x2Counter.get()).toBe(2);
  });

  it('can use actual signal state in subscribers', () => {
    const counter = signal(0);
    const x2Counter = signal((get) => get(counter) * 2);

    x2Counter.subscribe(() => {});

    counter.subscribe((value) => {
      expect(value * 2).toBe(x2Counter.get());
    });

    counter.set(1);
  });

  it('batches updates using batch function', () => {
    const subscriber = jest.fn();
    const counter = signal(0);

    counter.subscribe(subscriber, false);

    batch(() => {
      counter.set(1);
      counter.set(2);
      counter.set(3);
    });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('batches updates in subscribers', () => {
    const a = signal(0);
    const b = signal(0);
    const c = signal(0);
    const d = signal((get) => get(b) + get(c));
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
    const a = signal(0);
    const b = signal(0);
    const c = signal(0);
    const d = signal((get) => get(b) + get(c));
    const spy = jest.fn();

    d.subscribe(spy, false);

    a.subscribe(() => {
      b.set(1);
      c.set(1);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(2, false);
  });

  it('catches and logs exceptions in subscribers', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const a = signal(0);
    const sub = () => {
      throw 'ERROR';
    };

    a.subscribe(sub);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    configure();
  });

  describe('lifecycle hooks', () => {
    it('emits in right order', () => {
      const result: any = {};
      let order = 0;

      const counter = signal(0, {
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

      const counter = signal(0, {
        onActivate(v) {
          listener(v);
        },
      });

      expect(value).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      unsub = counter.subscribe(() => {});
      expect(value).toBe(0);
      expect(listener).toHaveBeenCalledTimes(1);

      counter.set(1);
      expect(value).toBe(0);
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      expect(value).toBe(0);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('correctly reacts to activation of previously calculated signal', () => {
      const spy = jest.fn();

      const a = signal(0, {
        onActivate: () => spy(),
      });
      const b = signal((get) => get(a) * 2);
      const c = signal((get) => get(b) * 2);
      const d = signal((get) => get(c) * 2);

      d.get();
      d.subscribe(() => {});

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('correctly reacts to activation of new dependency', () => {
      const spy = jest.fn();

      const a = signal(0);
      const b = signal(1, { onActivate: () => spy() });
      const c = signal((get) => get(a) && get(b));
      const d = signal((get) => get(c));

      d.subscribe(() => {});

      expect(spy).toHaveBeenCalledTimes(0);

      a.set(1);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('keeps subscribtions made inside the function on parent recalculation', () => {
      const spy = jest.fn();
      const a = signal(0);
      const b = signal(0, {
        onActivate() {
          a.subscribe(spy);
        },
      });
      const c = signal((get) => get(b));

      c.subscribe(() => {});
      expect(spy).toHaveBeenCalledTimes(1);

      a.set(1);
      expect(spy).toHaveBeenCalledTimes(2);

      b.set(1);
      expect(spy).toHaveBeenCalledTimes(2);

      a.set(2);
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe('onDeactivate option', () => {
    it('sets signal deactivation listener', () => {
      let value: any;
      let unsub: any;

      const listener = jest.fn((v) => (value = v));
      const counter = signal(0, { onDeactivate: (v) => listener(v) });

      expect(value).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      unsub = counter.subscribe(() => {});
      expect(value).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      counter.set(1);
      expect(value).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      unsub();
      expect(value).toBe(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('correctly reacts to deactivation of dependency', () => {
      const spy = jest.fn();

      const a = signal(1);
      const b = signal(1, { onDeactivate: () => spy() });
      const c = signal((get) => get(a) && get(b));
      const d = signal((get) => get(c));

      d.subscribe(() => {});

      expect(spy).toHaveBeenCalledTimes(0);

      a.set(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('onCreate option', () => {
    it('emits at the moment the signal is created', () => {
      const writableSpy = jest.fn((arg) => {});
      const computedSpy = jest.fn((arg) => {});

      const a = signal(0, { onCreate: writableSpy });
      expect(writableSpy).toHaveBeenCalledWith(0);

      const b = signal((get) => {}, { onCreate: computedSpy });
      expect(computedSpy).toHaveBeenCalledWith(undefined);
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

      const counter = signal(0, {
        onUpdate: (v, p) => listener(v, p),
      });

      expect(res.value).toBeUndefined();
      expect(res.prevValue).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      unsub = counter.subscribe(() => {});
      expect(res.value).toBeUndefined();
      expect(res.prevValue).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      counter.set(1);
      expect(res.value).toBe(1);
      expect(res.prevValue).toBe(0);
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      expect(res.value).toBe(1);
      expect(res.prevValue).toBe(0);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('onException option', () => {
    it('sets signal exception listener', () => {
      configure({
        logException: () => {},
      });

      const listener = jest.fn((e, v) => {
        error = e;
        lastValue = v;
      });

      let error: any;
      let lastValue: any;
      let unsub: any;

      const counter = signal(0);
      const x2Counter = signal(
        (get) => {
          if (get(counter) > 4) throw 'error';
          return get(counter) * 2;
        },
        {
          onException: (e, v) => listener(e, v),
        }
      );

      expect(error).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      unsub = x2Counter.subscribe(() => {});
      expect(error).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      counter.set(2);
      expect(error).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);
      expect(lastValue).toBeUndefined();

      counter.set(5);
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(lastValue).toBe(4);

      counter.set(6);
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(2);
      expect(lastValue).toBe(4);

      counter.set(3);
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(2);
      expect(lastValue).toBe(4);

      unsub();
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(2);
      expect(lastValue).toBe(4);

      configure();
    });

    it('correctly reacts to exceptions in intermideate signals', () => {
      configure({
        logException: () => {},
      });

      const listener = jest.fn((v) => (error = v));

      let error: any;
      let unsub: any;

      const counter = signal(0);
      const x2Counter = signal((get) => {
        if (get(counter) > 4) throw 'error';
        return get(counter) * 2;
      });
      const x4Counter = signal((get) => get(x2Counter) * 2, {
        onException: (v) => listener(v),
      });

      expect(error).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      unsub = x4Counter.subscribe(() => {});
      expect(error).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      counter.set(2);
      expect(error).toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(0);

      counter.set(5);
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(1);

      counter.set(6);
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(2);

      counter.set(3);
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(2);

      unsub();
      expect(error).toBe('error');
      expect(listener).toHaveBeenCalledTimes(2);

      configure();
    });
  });

  describe('name option', () => {
    it('can be set using the name property of signal options and accessed via this', () => {
      const spy = jest.fn((str) => {});

      const a = signal(0, {
        name: 'test',
        onUpdate() {
          spy(this.name);
        },
      });

      a.set(1);
      a.get();

      expect(spy).toHaveBeenLastCalledWith('test');
    });
  });

  describe('signal options', () => {
    it('allows to handle activation and deactivation of signals', () => {
      const activateSpy = jest.fn();
      const deactivateSpy = jest.fn();

      const a = signal(0);
      const b = signal(0);
      const c = signal(0);
      const d = signal(0);

      const a1 = signal((get) => get(a));
      const b1 = signal((get) => get(b), {
        onActivate: activateSpy,
        onDeactivate: deactivateSpy,
      });
      const c1 = signal((get) => get(c));
      const d1 = signal((get) => get(d));

      const a2 = signal((get) => get(a1));
      const b2 = signal((get) => get(b1));
      const c2 = signal((get) => get(c1));
      const d2 = signal((get) => get(d1));

      const res = signal((get) => {
        return get(a2) < 10 ? get(b2) + get(c2) + get(d2) : get(d2) + get(c2);
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

    it('allows to setup async chains of computations', () => {
      let res: any;

      const spy = jest.fn((value) => {
        res = value;
      });

      const url = signal('foo');
      const fetched = async((get: any, resolve: any) => {
        const value = get(url);
        resolve(value);
      });

      fetched.subscribe(spy);
      expect(res).toBeDefined();
      expect(res.data).toBe('foo');
      expect(spy).toHaveBeenCalledTimes(2);

      url.set('bar');
      expect(res.data).toBe('bar');
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('allows to setup async chains of computations (case 2)', () => {
      let res: any;

      const spy = jest.fn((value) => {
        res = value;
      });

      const url = signal('foo');
      const fetched = async((get: any, resolve: any) => {
        const value = get(url);
        resolve(value);
      });
      const fetchedComp = signal((get) => {
        return get(fetched);
      });

      fetchedComp.subscribe(spy);
      expect(res).toBeDefined();
      expect(res.data).toBe('foo');
      expect(spy).toHaveBeenCalledTimes(2);

      url.set('bar');
      expect(res.data).toBe('bar');
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('allows to setup async chains of computations (case 3)', () => {
      let res: any;

      const spy = jest.fn((value) => {
        res = value;
      });

      const url = signal('foo');
      const fetched = async((get: any, resolve: any) => {
        const value = get(url);
        resolve(value);
      });
      const fetchedComp = signal((get) => {
        return get(fetched);
      });
      const fetchedDeepComp = signal((get) => {
        return get(fetchedComp);
      });

      fetchedDeepComp.subscribe(spy);
      expect(res).toBeDefined();
      expect(res.data).toBe('foo');
      expect(spy).toHaveBeenCalledTimes(2);

      url.set('bar');
      expect(res.data).toBe('bar');
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
});

function async<T>(computation: any) {
  let id = 0;

  const data = signal();
  const error = signal();
  const rejected = signal(false);
  const pending = signal(true);

  const source = signal((get) => {
    const selfId = ++id;

    pending.set(true);

    computation(
      get,
      (value: any) => {
        if (selfId === id) {
          batch(() => {
            data.set(value);
            rejected.set(false);
            pending.set(false);
          });
        }
      },
      (e: unknown) => {
        if (selfId === id) {
          batch(() => {
            error.set(e);
            rejected.set(true);
            pending.set(false);
          });
        }
      }
    );
  });

  let unsub: any = null;

  const target = signal(
    (get) => {
      return {
        data: get(data),
        error: get(rejected) ? get(error) : undefined,
        pending: get(pending),
      };
    },
    {
      onActivate() {
        unsub = source.subscribe(noop);
      },
      onDeactivate() {
        if (unsub) unsub();
      },
    }
  );

  return target;
}

const noop = () => {};
