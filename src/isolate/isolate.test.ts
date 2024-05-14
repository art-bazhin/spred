import { computed } from '../computed/computed';
import { writable } from '../writable/writable';
import { isolate } from './isolate';

describe('isolate', () => {
  it('isolates passed fn from dependency tracking', () => {
    const spy = jest.fn();
    const count = writable(0);

    const comp = computed((get) => {
      isolate(() => {
        spy();
        count.get();
      });
    });

    comp.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes all inner subscriptions on parent calculation', () => {
    const innerSpy = jest.fn();
    const externalSpy = jest.fn();
    const deepSpy = jest.fn();

    const source = writable(0);
    const external = writable(0);

    const comp = computed((get) => {
      isolate(() => {
        const inner = computed((get) => {
          isolate(() => {
            const deep = computed((get) => get(external));
            deep.subscribe(() => deepSpy());
          });

          return get(external);
        });

        external.subscribe(() => externalSpy());
        inner.subscribe(() => innerSpy());
      });

      return get(source);
    });

    comp.subscribe(() => {});
    expect(innerSpy).toHaveBeenCalledTimes(1);
    expect(externalSpy).toHaveBeenCalledTimes(1);
    expect(deepSpy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(innerSpy).toHaveBeenCalledTimes(2);
    expect(externalSpy).toHaveBeenCalledTimes(2);
    expect(deepSpy).toHaveBeenCalledTimes(2);

    source.set(2);
    expect(innerSpy).toHaveBeenCalledTimes(3);
    expect(externalSpy).toHaveBeenCalledTimes(3);
    expect(deepSpy).toHaveBeenCalledTimes(3);

    external.set(1);
    expect(innerSpy).toHaveBeenCalledTimes(4);
    expect(externalSpy).toHaveBeenCalledTimes(4);
    expect(deepSpy).toHaveBeenCalledTimes(4);

    external.set(2);
    expect(innerSpy).toHaveBeenCalledTimes(5);
    expect(externalSpy).toHaveBeenCalledTimes(5);
    expect(deepSpy).toHaveBeenCalledTimes(5);

    external.set(3);
    expect(innerSpy).toHaveBeenCalledTimes(6);
    expect(externalSpy).toHaveBeenCalledTimes(6);
    expect(deepSpy).toHaveBeenCalledTimes(6);
  });

  it('unsubscribes all inner subscriptions on parent calculation (case 2)', () => {
    const spy = jest.fn();

    const source = writable(0);
    const external = writable(0);

    const innerFn1 = () => {
      isolate(() => {
        external.subscribe(() => spy());
      });

      return true;
    };

    const innerFn2 = () => {
      let res: any;

      isolate(() => {
        res = innerFn1();
      });

      return res;
    };

    const comp = computed((get) => {
      isolate(() => {
        const innerToggle = writable(true);
        const innerComp = computed((get) => get(innerToggle) && innerFn2());

        innerComp.subscribe(() => {});
      });

      return get(source);
    });

    comp.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    external.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    external.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('unsubscribes all inner subscriptions on parent calculation (case 3)', () => {
    const spy = jest.fn();

    const source = writable(0);
    const external = writable(0);

    const innerFn1 = () => {
      isolate(() => {
        external.subscribe(() => spy());
      });

      return true;
    };

    const innerFn2 = () => {
      let res: any;

      isolate(() => {
        res = innerFn1();
      });

      return res;
    };

    const comp = computed((get) => {
      isolate(() => {
        const innerToggle = writable(true);
        const innerComp = computed((get) => get(innerToggle) && innerFn2());

        innerComp.get();
      });

      return get(source);
    });

    comp.subscribe(() => {});
    expect(spy).toHaveBeenCalledTimes(1);

    source.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    external.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    external.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('can take args as second argument', () => {
    const fn = (n: number, s: string) => {
      expect(n).toBe(1);
      expect(s).toBe('foo');
    };

    isolate(fn, [1, 'foo']);
  });

  it('returns callback result', () => {
    expect(isolate(() => 1)).toBe(1);
    expect(isolate((v: any) => v, [1])).toBe(1);
  });
});
