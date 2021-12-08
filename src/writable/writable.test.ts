import { recalc } from '../core/core';
import { writable } from './writable';

describe('writable', () => {
  const counter = writable(0);

  it('is created with default value', () => {
    expect(counter()).toBe(0);
  });

  it('updates value', () => {
    counter(1);
    expect(counter()).toBe(1);
  });

  it('updates value using set method', () => {
    counter.set(2);
    expect(counter()).toBe(2);
  });

  it('has Atom methods', () => {
    expect(counter.get).toBeDefined;
    expect(counter.subscribe).toBeDefined;
  });

  it('force emits subscribers using notify method', () => {
    const subscriber = jest.fn();

    counter.subscribe(subscriber);
    counter.notify();
    recalc();

    expect(subscriber).toBeCalledTimes(2);
  });

  it('does not make redundant notifications', () => {
    const atom = writable(0);
    const subscriber = jest.fn();

    atom.subscribe(subscriber, false);

    atom(0);
    recalc();

    expect(subscriber).toBeCalledTimes(0);

    atom(1);
    atom(2);
    atom(0);
    recalc();

    expect(subscriber).toBeCalledTimes(0);

    atom.notify();
    atom(1);
    atom(2);
    atom(0);
    recalc();

    expect(subscriber).toBeCalledTimes(1);
  });
});
