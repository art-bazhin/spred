import { createComputed } from '../computed/computed';
import { createWritable, WritableSignal } from '../writable/writable';
import { configure } from '../config/config';
import { batch } from '../core/core';
import { createMemo } from '..';

describe('signal', () => {
  configure({
    logException: () => {},
  });

  const counter = createWritable(0);
  let unsub: () => any;
  let num: number;
  let x2Num: number;

  const subscriber = jest.fn((value: number, prevValue) => {
    num = value;
  });

  const altSubscriber = jest.fn((value: number) => (x2Num = value * 2));

  it('runs subscribers on subscribe', () => {
    unsub = counter.subscribe(subscriber);
    counter.subscribe(altSubscriber);

    expect(subscriber).toBeCalled();
    expect(num).toBe(0);
    expect(x2Num).toBe(0);
  });

  it('runs subscribers on every incoming value', () => {
    counter(0);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(0);
    expect(x2Num).toBe(0);

    counter(1);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(num).toBe(1);
    expect(x2Num).toBe(2);
  });

  it("doesn't subscribe one subscriber more than 1 time", () => {
    counter.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(num).toBe(1);
  });

  it('stops to trigger subscribers after unsubscribe', () => {
    unsub();
    counter(2);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(num).toBe(1);
  });

  it('correctly handles multiple unsubscribing', () => {
    const x2Counter = createComputed(() => 2 * counter());
    const x2Unsub = x2Counter.subscribe(() => {});

    expect(x2Counter()).toBe(4);

    x2Unsub();
    x2Unsub();

    counter(3);
    expect(x2Counter()).toBe(6);
  });

  it('does not track itself on subscribing', () => {
    const counter = createWritable(0);
    const gt5 = createMemo(() => counter() > 5);
    const res = createMemo(() => {
      if (gt5()) {
        const obj: any = {};

        counter.subscribe((v) => (obj.value = v));
        return obj;
      }

      return {} as any;
    });

    const spy = jest.fn();

    res.subscribe(spy, false);

    counter(1);
    counter(2);
    counter(3);
    counter(6);
    counter(7);
    counter(8);

    expect(spy).toBeCalledTimes(1);
  });

  it('does not track dependencies inside subscriber function', () => {
    const counter = createWritable(0);
    const gt5 = createMemo(() => counter() > 5);
    const res = createMemo(() => {
      if (gt5()) {
        const obj: any = {};

        counter.subscribe((v) => (obj.value = counter()));
        return obj;
      }

      return {} as any;
    });

    const spy = jest.fn();

    res.subscribe(spy, false);

    counter(1);
    counter(2);
    counter(3);
    counter(6);
    counter(7);
    counter(8);

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

    const a = createWritable(0);
    const b = createComputed(() => a() * 2);
    const c = createComputed(() => a() * 2);
    const d = createComputed(() => c() * 2);
    const e = createComputed(() => b() + d());

    const subscriber = jest.fn();

    e.subscribe(subscriber, false);

    a(1);

    expect(e()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('dynamically updates dependencies', () => {
    const counter = createWritable(0);
    const tumbler = createWritable(false);
    const x2Counter = createComputed(() => counter() * 2);
    const result = createComputed(() => (tumbler() ? x2Counter() : 'FALSE'));

    const subscriber = jest.fn();

    result.subscribe(subscriber, false);

    expect(result()).toBe('FALSE');

    counter(1);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(0);

    batch(() => {
      tumbler(true);
      counter(2);
    });

    expect(result()).toBe(4);
    expect(subscriber).toBeCalledTimes(1);

    tumbler(false);
    counter(3);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(2);

    counter(4);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(2);

    tumbler(true);
    expect(result()).toBe(8);
    expect(subscriber).toBeCalledTimes(3);

    counter(5);
    expect(result()).toBe(10);
    expect(subscriber).toBeCalledTimes(4);

    counter(6);
    expect(result()).toBe(12);
    expect(subscriber).toBeCalledTimes(5);
  });

  it('dynamically updates dependencies (case 2)', () => {
    const count = createWritable(0);
    const x2Count = createComputed(() => count() * 2);
    const sum = createComputed(() => count() + x2Count());

    const subSum = jest.fn();
    const subX2Xount = jest.fn();

    sum.subscribe(subSum);
    x2Count.subscribe(subX2Xount);

    expect(subX2Xount).toBeCalledTimes(1);

    count(1);
    expect(subX2Xount).toBeCalledTimes(2);
  });

  it('dynamically updates dependencies (case 3)', () => {
    const tumbler = createWritable(true);
    const a = createWritable('a');
    const b = createWritable('b');

    const sum = createMemo(() => {
      if (tumbler()) return a() + b();
      return b() + a();
    });

    const subSum = jest.fn();

    sum.subscribe(subSum);

    expect(subSum).toBeCalledTimes(1);

    tumbler(false);
    expect(subSum).toBeCalledTimes(2);

    tumbler(true);
    expect(subSum).toBeCalledTimes(3);
  });

  it('passes exceptions down to dependants', () => {
    const obj: WritableSignal<{ a: number } | null> = createWritable({
      a: 1,
    } as any);
    const num = createWritable(1);
    const objNum = createComputed(() => (obj() as any).a as number);
    const sum = createComputed(() => num() + objNum());
    const x2Sum = createComputed(() => sum() * 2);

    const subscriber = jest.fn();

    x2Sum.subscribe(subscriber);

    expect(sum()).toBe(2);
    expect(x2Sum()).toBe(4);

    batch(() => {
      obj(null);
      num(5);
    });

    expect(num()).toBe(5);
    expect(sum()).toBe(2);
    expect(x2Sum()).toBe(4);

    obj({ a: 5 });
    expect(sum()).toBe(10);
    expect(x2Sum()).toBe(20);
  });

  // it('can handle exceptions', () => {
  //   const subscriber = jest.fn();
  //   const counter = writable(0);

  //   const isMoreThanFive = computed(() => counter() > 5);

  //   const textWithError = computed(() => {
  //     if (isMoreThanFive()) throw new Error();
  //     return counter() + ' is less than five';
  //   });

  //   const text = computed(
  //     () => textWithError(),
  //     () => counter() + ' is more than five'
  //   );

  //   expect(text()).toBe('0 is less than five');

  //   counter(6);
  //   expect(text()).toBe('6 is more than five');

  //   text.subscribe(subscriber, false);

  //   counter(4);
  //   expect(text()).toBe('4 is less than five');
  //   expect(subscriber).toBeCalledTimes(1);

  //   counter(10);
  //   expect(text()).toBe('10 is more than five');
  //   expect(subscriber).toBeCalledTimes(2);
  // });

  it('continues to trigger dependants after error eliminated', () => {
    let str = '';

    const tumbler = createWritable(false);
    const counter = createWritable(0);

    const x2Counter = createComputed(() => {
      const res = counter() * 2;

      if (res > 5) throw new Error();

      return res;
    });

    const x4Counter = createComputed(() => x2Counter() * 2);

    const text = createComputed(() => {
      let res = 'OFF';
      if (tumbler()) res = `ON (${x4Counter()})`;

      return res;
    });

    text.subscribe((value) => {
      str = value;
    });

    expect(str).toBe('OFF');

    tumbler(true);
    expect(str).toBe('ON (0)');

    counter(5);
    expect(str).toBe('ON (0)');

    tumbler(false);
    expect(str).toBe('OFF');
  });

  it('returns previous value if an exception occured', () => {
    const counter = createWritable(0);

    const x2Counter = createComputed(() => {
      if (counter() > 5) throw new Error();
      return counter() * 2;
    });

    const x4Counter = createComputed(() => x2Counter() * 2);

    expect(x4Counter()).toBe(0);

    counter(20);
    expect(x4Counter()).toBe(0);
  });

  it('does not run subscribers if an exception occured', () => {
    const subscriber = jest.fn();

    const counter = createWritable(0);

    const x2Counter = createComputed(() => {
      if (counter() > 5) throw new Error();
      return counter() * 2;
    });

    const x4Counter = createComputed(() => x2Counter() * 2);

    x4Counter.subscribe(subscriber, false);

    counter(1);
    expect(x4Counter()).toBe(4);
    expect(subscriber).toBeCalledTimes(1);

    counter(20);
    expect(x4Counter()).toBe(4);
    expect(subscriber).toBeCalledTimes(1);
  });

  it('prevents circular dependencies', () => {
    let counter = 0;

    const a = createWritable(0);

    const b: any = createComputed(() => {
      if (!a()) return 0;

      const res = c();
      counter++;

      return res;
    });

    const c = createComputed(() => {
      return b();
    });

    expect(c()).toBe(0);
    expect(counter).toBe(0);

    a(1);

    expect(c()).toBe(0);
    expect(counter).toBeLessThan(2);

    counter = 0;
    c.subscribe(() => {});

    a(10);

    expect(c()).toBe(0);
    expect(counter).toBeLessThan(2);
  });

  it('can update writables in subscribers', () => {
    const counter = createWritable(0);
    const x2Counter = createWritable(0);

    counter.subscribe((value) => x2Counter(value * 2));

    counter(1);

    expect(x2Counter()).toBe(2);
  });

  it('can use actual writable state in subscribers', () => {
    const counter = createWritable(0);
    const x2Counter = createComputed(() => counter() * 2);

    x2Counter.subscribe(() => {});

    counter.subscribe((value) => {
      expect(value * 2).toBe(x2Counter());
    });

    counter(1);
  });

  it('batches updates using batch function', () => {
    const subscriber = jest.fn();
    const counter = createWritable(0);

    counter.subscribe(subscriber, false);

    batch(() => {
      counter(1);
      counter(2);
      counter(3);
    });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
