import { computed } from '../computed/computed';
import { signal, WritableSignal } from '../signal/signal';
import { configure } from '../config/config';
import { batch } from '..';

describe('signal', () => {
  configure({
    logException: () => {},
  });

  const counter = signal(0);
  let unsub: () => any;
  let num: number;
  let prevNum: number;
  let x2Num: number;

  const subscriber = jest.fn((value: number, prevValue) => {
    prevNum = prevValue;
    num = value;
  });

  const altSubscriber = jest.fn((value: number) => (x2Num = value * 2));

  it('runs subscribers on subscribe', () => {
    unsub = counter.subscribe(subscriber);
    counter.subscribe(altSubscriber);

    expect(subscriber).toBeCalled();
    expect(num).toBe(0);
    expect(prevNum).toBe(undefined);
    expect(x2Num).toBe(0);
  });

  it('runs subscribers on every incoming value', () => {
    counter(0);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(0);
    expect(prevNum).toBe(0);
    expect(x2Num).toBe(0);

    counter(1);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(num).toBe(1);
    expect(prevNum).toBe(0);
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
    const x2Counter = computed(() => 2 * counter());
    const x2Unsub = x2Counter.subscribe(() => {});

    expect(x2Counter()).toBe(4);

    x2Unsub();
    x2Unsub();

    counter(3);
    expect(x2Counter()).toBe(6);
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
    const b = computed(() => a() * 2);
    const c = computed(() => a() * 2);
    const d = computed(() => c() * 2);
    const e = computed(() => b() + d());

    const subscriber = jest.fn();

    e.subscribe(subscriber, false);

    a(1);

    expect(e()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('dynamically updates dependencies', () => {
    const counter = signal(0);
    const tumbler = signal(false);
    const x2Counter = computed(() => counter() * 2);
    const result = computed(() => (tumbler() ? x2Counter() : 'FALSE'));

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
  });

  it('catches exception and pass it down to dependants', () => {
    let error: Error | undefined = undefined;

    const obj: WritableSignal<{ a: number } | null> = signal({ a: 1 });
    const num = signal(1);
    const objNum = computed(() => (obj() as any).a as number);
    const sum = computed(
      () => {
        error = undefined;
        return num() + objNum();
      },
      (e) => {
        error = e as any;
        throw e;
      }
    );

    const subscriber = jest.fn();

    sum.subscribe(subscriber);

    expect(sum()).toBe(2);
    expect(error).toBeUndefined();

    obj(null);
    num(5);
    expect(sum()).toBe(2);
    expect(error).toBeDefined();

    obj({ a: 5 });
    expect(sum()).toBe(10);
    expect(error).toBeUndefined();
  });

  it('can handle exceptions', () => {
    const subscriber = jest.fn();
    const counter = signal(0);

    const isMoreThanFive = computed(() => counter() > 5);

    const textWithError = computed(() => {
      if (isMoreThanFive()) throw new Error();
      return counter() + ' is less than five';
    });

    const text = computed(
      () => textWithError(),
      () => counter() + ' is more than five'
    );

    expect(text()).toBe('0 is less than five');

    counter(6);
    expect(text()).toBe('6 is more than five');

    text.subscribe(subscriber, false);

    counter(4);
    expect(text()).toBe('4 is less than five');
    expect(subscriber).toBeCalledTimes(1);

    counter(10);
    expect(text()).toBe('10 is more than five');
    expect(subscriber).toBeCalledTimes(2);
  });

  it('continues to trigger dependants after error eliminated', () => {
    let error: Error | undefined = undefined;
    let str = '';

    const tumbler = signal(false);
    const counter = signal(0);

    const x2Counter = computed(() => {
      const res = counter() * 2;

      if (res > 5) throw new Error();

      return res;
    });

    const x4Counter = computed(() => x2Counter() * 2);

    const text = computed(
      () => {
        let res = 'OFF';
        if (tumbler()) res = `ON (${x4Counter()})`;

        error = undefined;

        return res;
      },
      (e) => {
        error = e as any;
        throw e;
      }
    );

    text.subscribe((value) => {
      str = value;
    });

    expect(str).toBe('OFF');
    expect(error).toBeUndefined();

    tumbler(true);

    expect(str).toBe('ON (0)');
    expect(error).toBeUndefined();

    counter(5);

    expect(str).toBe('ON (0)');
    expect(error).toBeDefined();

    tumbler(false);

    expect(str).toBe('OFF');
    expect(error).toBeUndefined();
  });

  it('returns previous value if an exception occured', () => {
    const counter = signal(0);

    const x2Counter = computed(() => {
      if (counter() > 5) throw new Error();
      return counter() * 2;
    });

    const x4Counter = computed(() => x2Counter() * 2);

    expect(x4Counter()).toBe(0);

    counter(20);
    expect(x4Counter()).toBe(0);
  });

  it('does not run subscribers if an exception occured', () => {
    const subscriber = jest.fn();

    const counter = signal(0);

    const x2Counter = computed(() => {
      if (counter() > 5) throw new Error();
      return counter() * 2;
    });

    const x4Counter = computed(() => x2Counter() * 2);

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

    const a = signal(0);

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

    a(1);

    expect(c()).toBe(0);
    expect(counter).toBeLessThan(2);

    counter = 0;
    c.subscribe(() => {});

    a(10);

    expect(c()).toBe(0);
    expect(counter).toBeLessThan(2);
  });

  it('can update atoms in subscribers', () => {
    const counter = signal(0);
    const x2Counter = signal(0);

    counter.subscribe((value) => x2Counter(value * 2));

    counter(1);

    expect(x2Counter()).toBe(2);
  });

  it('can use actual atom state in subscribers', () => {
    const counter = signal(0);
    const x2Counter = computed(() => counter() * 2);

    x2Counter.activate();

    counter.subscribe((value) => {
      expect(value * 2).toBe(x2Counter());
    });

    counter(1);
  });

  it('batches updates using batch function', () => {
    const subscriber = jest.fn();
    const counter = signal(0);

    counter.subscribe(subscriber, false);

    batch(() => {
      counter(1);
      counter(2);
      counter(3);
    });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  describe('value method', () => {
    it('returns current atom value without calculation', () => {
      const counter = signal(5);
      const x2Counter = computed(() => counter() * 2);

      expect(x2Counter.value()).toBe(undefined);

      x2Counter();
      expect(x2Counter.value()).toBe(10);
    });
  });

  describe('activate method', () => {
    it('forces an atom to recalculate its value on dependency changes', () => {
      const counter = signal(5);
      const x2Counter = computed(() => counter() * 2);

      expect(x2Counter.value()).toBe(undefined);

      counter(10);
      expect(x2Counter.value()).toBe(undefined);

      x2Counter.activate();
      expect(x2Counter.value()).toBe(20);

      counter(15);
      expect(x2Counter.value()).toBe(30);
    });
  });
});
