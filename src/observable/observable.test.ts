import { computed } from '../computed/computed';
import { atom, Atom } from '../atom/atom';
import { recalc } from '../main';

describe('observable', () => {
  const counter = atom(0);
  let unsub: () => any;
  let num: number;
  let x2Num: number;

  const subscriber = jest.fn((value: number) => (num = value));
  const altSubscriber = jest.fn((value: number) => (x2Num = value * 2));

  it('runs subscribers on subscribe', () => {
    unsub = counter.subscribe(subscriber);
    counter.subscribe(altSubscriber);

    expect(subscriber).toBeCalled();
    expect(num).toBe(0);
    expect(x2Num).toBe(0);
  });

  it('runs subscribers on value change', () => {
    counter(0);
    recalc();

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(num).toBe(0);
    expect(x2Num).toBe(0);

    counter(1);
    recalc();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
    expect(x2Num).toBe(2);
  });

  it("doesn't subscribe one subscriber more than 1 time", () => {
    counter.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
  });

  it('stops to trigger subscribers after unsubscribe', () => {
    unsub();
    counter(2);
    recalc();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
  });

  it("doesn't trigger subscribers if value hasn't changed", () => {
    const a = atom(1);
    const b = atom(2);
    const c = computed(() => a() + b());
    const d = computed(() => c() * 2);

    const subscriber = jest.fn();

    d.subscribe(subscriber, false);

    expect(d()).toBe(6);

    a(2);
    b(1);

    expect(d()).toBe(6);
    expect(subscriber).toHaveBeenCalledTimes(0);
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
    const counter = atom(0);
    const tumbler = atom(false);
    const x2Counter = computed(() => counter() * 2);
    const result = computed(() => (tumbler() ? x2Counter() : 'FALSE'));

    const subscriber = jest.fn();

    result.subscribe(subscriber, false);

    expect(result()).toBe('FALSE');

    counter(1);
    expect(result()).toBe('FALSE');
    expect(subscriber).toBeCalledTimes(0);

    tumbler(true);
    counter(2);
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

  it('catches error and pass it down to dependants', () => {
    const obj: Atom<{ a: number } | null> = atom({ a: 1 });
    const num = atom(1);
    const objNum = computed(() => (obj() as any).a as number);
    const sum = computed(() => num() + objNum());

    let error: Error | undefined = undefined;

    const subscriber = jest.fn((_, err) => (error = err));

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

  it('can update atoms in subscribers', () => {
    const counter = atom(0);
    const x2Counter = atom(0);

    counter.subscribe((value) => x2Counter(value * 2));

    counter(1);
    recalc();

    expect(x2Counter()).toBe(2);
  });
});
