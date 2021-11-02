import { atom } from "./atom";

describe('atom', () => {
  const counter = atom(0);

  it('is created with default value', () => {
    expect(counter()).toBe(0);
  });

  it('updates value', () => {
    counter(1);
    expect(counter()).toBe(1);
  })

  it('updates value using set method', () => {
    counter.set(2);
    expect(counter()).toBe(2);
  })

  it('has Observable methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });
});