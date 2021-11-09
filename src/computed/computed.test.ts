import { computed } from './computed';
import { atom } from '../atom/atom';

describe('computed', () => {
  const a = atom(1);
  const b = atom(2);
  const c = atom(3);
  const d = atom(4);

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

  it('has Observable methods', () => {
    expect(a.get).toBeDefined;
    expect(a.subscribe).toBeDefined;
  });
});
