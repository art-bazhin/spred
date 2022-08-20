import { computed } from '../computed/computed';
import { writable } from '../writable/writable';
import { isolate } from './isolate';

describe('isolate', () => {
  it('isolates passed fn from dependency tracking', () => {
    const spy = jest.fn();
    const count = writable(0);

    const comp = computed(() => {
      isolate(() => {
        spy();
        count();
      });
    });

    comp.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    count(1);
    expect(spy).toBeCalledTimes(1);
  });

  it('unsubscribes all inner subscriptions on parent calculation', () => {
    const innerSpy = jest.fn();
    const externalSpy = jest.fn();
    const deepSpy = jest.fn();

    const source = writable(0);
    const external = writable(0);

    const comp = computed(() => {
      isolate(() => {
        const inner = computed(() => {
          isolate(() => {
            const deep = computed(external);
            deep.subscribe(() => deepSpy());
          });

          return external();
        });

        external.subscribe(() => externalSpy());
        inner.subscribe(() => innerSpy());
      });

      return source();
    });

    comp.subscribe(() => {});
    expect(innerSpy).toBeCalledTimes(1);
    expect(externalSpy).toBeCalledTimes(1);
    expect(deepSpy).toBeCalledTimes(1);

    source(1);
    expect(innerSpy).toBeCalledTimes(2);
    expect(externalSpy).toBeCalledTimes(2);
    expect(deepSpy).toBeCalledTimes(2);

    source(2);
    expect(innerSpy).toBeCalledTimes(3);
    expect(externalSpy).toBeCalledTimes(3);
    expect(deepSpy).toBeCalledTimes(3);

    external(1);
    expect(innerSpy).toBeCalledTimes(4);
    expect(externalSpy).toBeCalledTimes(4);
    expect(deepSpy).toBeCalledTimes(4);

    external(2);
    expect(innerSpy).toBeCalledTimes(5);
    expect(externalSpy).toBeCalledTimes(5);
    expect(deepSpy).toBeCalledTimes(5);
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

    const comp = computed(() => {
      isolate(() => {
        const innerToggle = writable(true);
        const innerComp = computed(() => innerToggle() && innerFn2());

        innerComp.subscribe(() => {});
      });

      return source();
    });

    comp.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    external(1);
    expect(spy).toBeCalledTimes(3);

    external(2);
    expect(spy).toBeCalledTimes(4);
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

    const comp = computed(() => {
      isolate(() => {
        const innerToggle = writable(true);
        const innerComp = computed(() => innerToggle() && innerFn2());

        innerComp();
      });

      return source();
    });

    comp.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    external(1);
    expect(spy).toBeCalledTimes(3);

    external(2);
    expect(spy).toBeCalledTimes(4);
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
