import { computed } from './computed';
import { writable } from '../writable/writable';
import { configure } from '../config/config';
import {
  onActivate,
  onDeactivate,
  onException,
  onNotifyEnd,
  onNotifyStart,
  onUpdate,
} from '../lifecycle/lifecycle';

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

  it('has Signal methods', () => {
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
    const counter = writable(0);
    const stringCounter = writable('0');

    const x2Counter = computed(() => {
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

    const field = writable('bar');
    const count = computed(() => obj[field()]);

    count.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('logs unhandled exceptions in nested computeds', () => {
    const spy = jest.fn();

    configure({
      logException: spy,
    });

    const obj = null as any;

    const field = writable('bar');
    const count = computed(() => obj[field()]);

    const parent = computed(() => count());

    parent.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('unsubscribes inner subscriptions on every calculation', () => {
    const spy = jest.fn();

    const source = writable(0);
    const ext = writable(0);

    const comp = computed(() => {
      ext.subscribe(() => spy());
      return source();
    });

    comp.subscribe(() => {});
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

  it('unsubscribes inner lifecycle subscriptions on every calculation', () => {
    const onActivateSpy = jest.fn();
    const onDeactivateSpy = jest.fn();
    const onUpdateSpy = jest.fn();
    const onExceptionSpy = jest.fn();
    const onNotifyStartSpy = jest.fn();
    const onNotifyEndSpy = jest.fn();

    const source = writable(0);
    const extSource = writable(0);
    const ext = computed(() => {
      if (extSource() < 0) throw 'error';
      return extSource();
    });

    const comp = computed(() => {
      onActivate(ext, () => onActivateSpy());
      onDeactivate(ext, () => onDeactivateSpy());
      onUpdate(ext, () => onUpdateSpy());
      onException(ext, () => onExceptionSpy());
      onNotifyStart(ext, () => onNotifyStartSpy());
      onNotifyEnd(ext, () => onNotifyEndSpy());
      return source();
    });

    comp.subscribe(() => {});
    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onExceptionSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    source(1);
    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onExceptionSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    const extUnsub = ext.subscribe(() => {});
    expect(onActivateSpy).toBeCalledTimes(1);

    extSource(1);
    expect(onUpdateSpy).toBeCalledTimes(1);
    expect(onNotifyStartSpy).toBeCalledTimes(1);
    expect(onNotifyEndSpy).toBeCalledTimes(1);

    extSource(-1);
    expect(onExceptionSpy).toBeCalledTimes(1);

    extUnsub();
    expect(onDeactivateSpy).toBeCalledTimes(1);
  });

  it('cleans up subscriptions inside a subscriber on every update', () => {
    const spy = jest.fn();
    const a = writable(0);
    const aComp = computed(() => a());
    const b = writable(0);

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

  it('cleans up deep nested subscriptions inside a subscriber on every update', () => {
    const spy = jest.fn();
    const a = writable(0);
    const aComp = computed(() => a());
    const b = writable(0);

    const wrap = computed(() => {
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

  it('cleans up lifecycle subscriptions inside a subscriber on every update', () => {
    const a = writable(0);
    const aComp = computed(() => a());

    const onActivateSpy = jest.fn();
    const onDeactivateSpy = jest.fn();
    const onUpdateSpy = jest.fn();
    const onExceptionSpy = jest.fn();
    const onNotifyStartSpy = jest.fn();
    const onNotifyEndSpy = jest.fn();

    const extSource = writable(0);
    const ext = computed(() => {
      if (extSource() < 0) throw 'error';
      return extSource();
    });

    aComp.subscribe(() => {
      onActivate(ext, () => onActivateSpy());
      onDeactivate(ext, () => onDeactivateSpy());
      onUpdate(ext, () => onUpdateSpy());
      onException(ext, () => onExceptionSpy());
      onNotifyStart(ext, () => onNotifyStartSpy());
      onNotifyEnd(ext, () => onNotifyEndSpy());
    });

    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onExceptionSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    a(1);
    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onExceptionSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    const extUnsub = ext.subscribe(() => {});
    expect(onActivateSpy).toBeCalledTimes(1);

    extSource(1);
    expect(onUpdateSpy).toBeCalledTimes(1);
    expect(onNotifyStartSpy).toBeCalledTimes(1);
    expect(onNotifyEndSpy).toBeCalledTimes(1);

    extSource(-1);
    expect(onExceptionSpy).toBeCalledTimes(1);

    extUnsub();
    expect(onDeactivateSpy).toBeCalledTimes(1);
  });

  it('cleans up deep nested lifecycle subscriptions inside a subscriber on every update', () => {
    const a = writable(0);
    const aComp = computed(() => a());

    const onActivateSpy = jest.fn();
    const onDeactivateSpy = jest.fn();
    const onUpdateSpy = jest.fn();
    const onExceptionSpy = jest.fn();
    const onNotifyStartSpy = jest.fn();
    const onNotifyEndSpy = jest.fn();

    const extSource = writable(0);
    const ext = computed(() => {
      if (extSource() < 0) throw 'error';
      return extSource();
    });

    const wrap = computed(() => {
      aComp.subscribe(() => {
        onActivate(ext, () => onActivateSpy());
        onDeactivate(ext, () => onDeactivateSpy());
        onUpdate(ext, () => onUpdateSpy());
        onException(ext, () => onExceptionSpy());
        onNotifyStart(ext, () => onNotifyStartSpy());
        onNotifyEnd(ext, () => onNotifyEndSpy());
      });
    });

    wrap();

    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onExceptionSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    a(1);
    expect(onActivateSpy).toBeCalledTimes(0);
    expect(onDeactivateSpy).toBeCalledTimes(0);
    expect(onUpdateSpy).toBeCalledTimes(0);
    expect(onExceptionSpy).toBeCalledTimes(0);
    expect(onNotifyStartSpy).toBeCalledTimes(0);
    expect(onNotifyEndSpy).toBeCalledTimes(0);

    const extUnsub = ext.subscribe(() => {});
    expect(onActivateSpy).toBeCalledTimes(1);

    extSource(1);
    expect(onUpdateSpy).toBeCalledTimes(1);
    expect(onNotifyStartSpy).toBeCalledTimes(1);
    expect(onNotifyEndSpy).toBeCalledTimes(1);

    extSource(-1);
    expect(onExceptionSpy).toBeCalledTimes(1);

    extUnsub();
    expect(onDeactivateSpy).toBeCalledTimes(1);
  });
});
