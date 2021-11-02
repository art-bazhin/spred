import { computed } from "./computed";
import { atom } from "../atom/atom";

describe('computed', () => {
  const double = (value: number) => value * 2;

  const counter = atom(0);
  const x2Counter = computed(() => double(counter()));
  const x4Counter = computed(() => double(x2Counter()));

  it('is calculates value properly after creation', () => {
    expect(x2Counter()).toBe(double(counter()));
    expect(x4Counter()).toBe(double(x2Counter()));
  });

  it('updates value after dependency value change', () => {
    counter(1);
    
    expect(x2Counter()).toBe(double(counter()));
    expect(x4Counter()).toBe(double(x2Counter()));
  })

  it('has Observable methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });
});