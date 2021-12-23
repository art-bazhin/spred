import { computed } from './computed';
import { writable } from '../writable/writable';

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
    a(4);
    b(3);
    c(2);
    d(1);

    expect(a2()).toBe(2);
    expect(b2()).toBe(-1);
    expect(c2()).toBe(4);
    expect(d2()).toBe(4);
  });

  it('has Atom methods', () => {
    expect(a.get).toBeDefined;
    expect(a.subscribe).toBeDefined;
  });

  it('filters undefined values', () => {
    const counter = writable(0);
    let test: any;
    let unsub: any;

    const x2Counter = computed(() => {
      const c = counter() * 2;
      if (c > 25) return c;
      return undefined;
    }, null);

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
});
