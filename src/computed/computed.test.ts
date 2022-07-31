import { createComputed } from './computed';
import { createWritable } from '../writable/writable';
import { configure } from '../config/config';

describe('computed', () => {
  const a = createWritable(1);
  const b = createWritable(2);
  const c = createWritable(3);
  const d = createWritable(4);

  const a1 = createComputed(() => b());
  const b1 = createComputed(() => a() - c());
  const c1 = createComputed(() => b() + d());
  const d1 = createComputed(() => c());

  const a2 = createComputed(() => b1());
  const b2 = createComputed(() => a1() - c1());
  const c2 = createComputed(() => b1() + d1());
  const d2 = createComputed(() => c1());

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

  it('filters undefined values', () => {
    const counter = createWritable(0);
    let test: any;
    let unsub: any;

    const x2Counter = createComputed(() => {
      const c = counter() * 2;
      if (c > 25) return c;
      return undefined;
    });

    expect(x2Counter()).toBe(undefined);

    counter(11);
    expect(x2Counter()).toBe(undefined);

    counter(15);
    expect(x2Counter()).toBe(30);

    counter(12);
    expect(x2Counter()).toBe(30);

    counter(11);
    unsub = x2Counter.subscribe((v) => (test = v));
    expect(test).toBe(30);
    expect(x2Counter()).toBe(30);

    counter(20);
    counter(11);
    expect(x2Counter()).toBe(40);
    expect(test).toBe(40);

    counter(1);
    expect(x2Counter()).toBe(40);
    expect(test).toBe(40);

    counter(16);
    expect(x2Counter()).toBe(32);
    expect(test).toBe(32);

    counter(15);
    expect(x2Counter()).toBe(30);
    expect(test).toBe(30);

    unsub();
    expect(x2Counter()).toBe(30);
    expect(test).toBe(30);

    counter(20);
    counter(11);
    expect(x2Counter()).toBe(30);
  });

  it('can pass values to writable signals during computing', () => {
    const counter = createWritable(0);
    const stringCounter = createWritable('0');

    const x2Counter = createComputed(() => {
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

    const field = createWritable('bar');
    const count = createComputed(() => obj[field()]);

    count.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('logs unhandled exceptions in nested computeds', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = createWritable('bar');
    const count = createComputed(() => obj[field()]);

    const parent = createComputed(() => count());

    parent.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('unsubscribes inner subscriptions on every calculation', () => {
    const spy = jest.fn();

    const source = createWritable(0);
    const ext = createWritable(0);

    const computed = createComputed(() => {
      ext.subscribe(() => spy());
      return source();
    });

    computed.subscribe(() => {});
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

  it('clean up nested subscriptions on every update', () => {
    const spy = jest.fn();
    const a = createWritable(0);
    const aComp = createComputed(() => a());
    const b = createWritable(0);

    aComp.subscribe(() => {
      b.subscribe(() => spy());
    });

    expect(spy).toBeCalledTimes(1);

    a(1);
    expect(spy).toBeCalledTimes(2);

    b(1);
    expect(spy).toBeCalledTimes(3);

    b(2);
    expect(spy).toBeCalledTimes(4);
  });

  it('clean up deep nested subscriptions on every update', () => {
    const spy = jest.fn();
    const a = createWritable(0);
    const aComp = createComputed(() => a());
    const b = createWritable(0);

    const wrap = createComputed(() => {
      aComp.subscribe(() => {
        b.subscribe(() => spy());
      });
    });

    wrap();

    expect(spy).toBeCalledTimes(1);

    a(1);
    expect(spy).toBeCalledTimes(2);

    b(1);
    expect(spy).toBeCalledTimes(3);

    b(2);
    expect(spy).toBeCalledTimes(4);
  });
});
