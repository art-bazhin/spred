import { writable, computed, configure } from '..';
import { onActivate, onUpdate, onDeactivate, onException } from './lifecycle';

describe('lifecycle signals', () => {
  it('emits in right order', () => {
    const counter = writable(0);

    const result: any = {};
    let order = 0;

    onActivate(counter, () => (result.activate = ++order));
    onDeactivate(counter, () => (result.deactivate = ++order));
    onUpdate(counter, () => (result.update = ++order));

    const unsub = counter.subscribe(() => {});
    counter(1);
    unsub();

    expect(result.activate).toBe(1);
    expect(result.update).toBe(2);
    expect(result.deactivate).toBe(3);
  });

  it('does not subscribe same listenr twice', () => {
    const counter = writable(0);
    const spy = jest.fn();

    onUpdate(counter, spy);
    onUpdate(counter, spy);

    counter(1);
    expect(spy).toBeCalledTimes(1);
  });
});

describe('onActivate function', () => {
  it('sets signal activation listener', () => {
    let value: any;
    let unsub: any;

    const counter = writable(0);
    const listener = jest.fn((v) => (value = v));

    onActivate(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);

    counter(1);
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(value).toBe(0);
    expect(listener).toBeCalledTimes(1);
  });

  it('correctly reacts to activation of previously calculated signal', () => {
    const spy = jest.fn();

    const a = writable(0);
    const b = computed(() => a() * 2);
    const c = computed(() => b() * 2);
    const d = computed(() => c() * 2);

    d();
    onActivate(b, spy);
    d.subscribe(() => {});

    expect(spy).toBeCalledTimes(1);
  });

  it('correctly reacts to activation of new dependency', () => {
    const spy = jest.fn();

    const a = writable(0);
    const b = writable(1);
    const c = computed(() => a() && b());
    const d = computed(() => c());

    onActivate(b, spy);
    d.subscribe(() => {});

    expect(spy).toBeCalledTimes(0);

    a(1);

    expect(spy).toBeCalledTimes(1);
  });
});

describe('onDeactivate function', () => {
  it('sets signal deactivation listener', () => {
    let value: any;
    let unsub: any;

    const counter = writable(0);
    const listener = jest.fn((v) => (value = v));

    onDeactivate(counter, listener);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    expect(value).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub();
    expect(value).toBe(1);
    expect(listener).toBeCalledTimes(1);
  });

  it('correctly reacts to deactivation of dependency', () => {
    const spy = jest.fn();

    const a = writable(1);
    const b = writable(1);
    const c = computed(() => a() && b());
    const d = computed(() => c());

    onDeactivate(b, spy);
    d.subscribe(() => {});

    expect(spy).toBeCalledTimes(0);

    a(0);
    expect(spy).toBeCalledTimes(1);
  });
});

describe('onUpdate function', () => {
  it('sets signal update listener', () => {
    let res: any = {};
    let unsub: any;

    const counter = writable(0);
    const listener = jest.fn((v, p) => {
      res.value = v;
      res.prevValue = p;
    });

    onUpdate(counter, listener);
    expect(res.value).toBeUndefined();
    expect(res.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = counter.subscribe(() => {});
    expect(res.value).toBeUndefined();
    expect(res.prevValue).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(1);
    expect(res.value).toBe(1);
    expect(res.prevValue).toBe(0);
    expect(listener).toBeCalledTimes(1);

    unsub();
    expect(res.value).toBe(1);
    expect(res.prevValue).toBe(0);
    expect(listener).toBeCalledTimes(1);
  });
});

describe('onException function', () => {
  it('sets signal exception listener', () => {
    configure({
      logException: () => {},
    });

    let error: any;
    let unsub: any;

    const counter = writable(0);
    const x2Counter = computed(() => {
      if (counter() > 4) throw 'error';
      return counter() * 2;
    });
    const listener = jest.fn((v) => (error = v));

    onException(x2Counter, listener);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = x2Counter.subscribe(() => {});
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(2);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(5);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(1);

    counter(6);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    counter(3);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    unsub();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    configure();
  });

  it('correctly reacts to exceptions in intermideate signals', () => {
    configure({
      logException: () => {},
    });

    let error: any;
    let unsub: any;

    const counter = writable(0);
    const x2Counter = computed(() => {
      if (counter() > 4) throw 'error';
      return counter() * 2;
    });
    const x4Counter = computed(() => x2Counter() * 2);
    const listener = jest.fn((v) => (error = v));

    onException(x4Counter, listener);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    unsub = x4Counter.subscribe(() => {});
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(2);
    expect(error).toBeUndefined();
    expect(listener).toBeCalledTimes(0);

    counter(5);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(1);

    counter(6);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    counter(3);
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    unsub();
    expect(error).toBe('error');
    expect(listener).toBeCalledTimes(2);

    configure();
  });
});
