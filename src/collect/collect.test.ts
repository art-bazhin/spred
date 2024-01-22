import { computed } from '../computed/computed';
import { collect } from '../core/core';
import { writable } from '../writable/writable';

describe('collect function', () => {
  it('isolates passed fn from outer dependency tracking', () => {
    const spy = jest.fn();
    const a = writable(0);
    const b = writable(0);

    const comp = computed(() => {
      collect(() => {
        b.get();
      });

      return a.get();
    });

    comp.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('returnes cleanup fn', () => {
    const spy = jest.fn();
    const spyInner = jest.fn();
    const spyComp = jest.fn();

    const a = writable(0);

    const cleanup = collect(() => {
      a.subscribe(spy);

      const b = writable(0);

      const comp = computed(() => {
        b.subscribe(spyInner);
        return a.get();
      });

      comp.subscribe(spyComp);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyInner).toHaveBeenCalledTimes(1);
    expect(spyComp).toHaveBeenCalledTimes(1);

    a.set(1);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spyInner).toHaveBeenCalledTimes(2);
    expect(spyComp).toHaveBeenCalledTimes(2);

    cleanup();
    a.set(2);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spyInner).toHaveBeenCalledTimes(2);
    expect(spyComp).toHaveBeenCalledTimes(2);
  });
});
