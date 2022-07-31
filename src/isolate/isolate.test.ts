import { createComputed } from '../computed/computed';
import { createWritable } from '../writable/writable';
import { isolate } from './isolate';

describe('isolate', () => {
  it('isolates passed fn from dependency tracking', () => {
    const spy = jest.fn();
    const count = createWritable(0);

    const computed = createComputed(() => {
      isolate(() => {
        spy();
        count();
      });
    });

    computed.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    count(1);
    expect(spy).toBeCalledTimes(1);
  });

  it('unsubscribes all inner subscriptions on parent calculation', () => {
    const innerSpy = jest.fn();
    const externalSpy = jest.fn();
    const deepSpy = jest.fn();

    const source = createWritable(0);
    const external = createWritable(0);

    const computed = createComputed(() => {
      isolate(() => {
        const inner = createComputed(() => {
          isolate(() => {
            const deep = createComputed(external);
            deep.subscribe(() => deepSpy());
          });

          return external();
        });

        external.subscribe(() => externalSpy());
        inner.subscribe(() => innerSpy());
      });

      return source();
    });

    computed.subscribe(() => {});
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

    const source = createWritable(0);
    const external = createWritable(0);

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

    const computed = createComputed(() => {
      isolate(() => {
        const innerToggle = createWritable(true);
        const innerComp = createComputed(() => innerToggle() && innerFn2());

        innerComp.subscribe(() => {});
      });

      return source();
    });

    computed.subscribe(() => {});
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

    const source = createWritable(0);
    const external = createWritable(0);

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

    const computed = createComputed(() => {
      isolate(() => {
        const innerToggle = createWritable(true);
        const innerComp = createComputed(() => innerToggle() && innerFn2());

        innerComp();
      });

      return source();
    });

    computed.subscribe(() => {});
    expect(spy).toBeCalledTimes(1);

    source(1);
    expect(spy).toBeCalledTimes(2);

    external(1);
    expect(spy).toBeCalledTimes(3);

    external(2);
    expect(spy).toBeCalledTimes(4);
  });
});
