import { signal, batch, WritableSignal } from '..';

describe('writable', () => {
  const counter = signal(0);

  it('is created with default value', () => {
    expect(counter.value).toBe(0);
  });

  it('updates value', () => {
    counter.set(1);
    expect(counter.value).toBe(1);
  });

  it('updates value using set method', () => {
    counter.set(2);
    expect(counter.value).toBe(2);
  });

  it('returns void after set', () => {
    const newValue = counter.set(3);
    expect(newValue).toBeUndefined();
  });

  it('returns void value after notifiing', () => {
    const value = counter.emit();
    expect(value).toBeUndefined();
  });

  it('updates value using update fn', () => {
    counter.update((value) => value + 1);
    expect(counter.value).toBe(4);

    batch(() => {
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
      counter.update((value) => value + 1);
    });

    expect(counter.value).toBe(8);
  });

  it('updates value using update fn right after init', () => {
    const counter = signal(0);

    counter.update((v) => v + 1);
    expect(counter.value).toBe(1);
  });

  it('fully ignores undefined values', () => {
    const s = signal<any>(0);

    s.set(undefined);
    s.update((v) => expect(v).toBe(0));
  });

  it('has Signal methods', () => {
    expect(counter.subscribe).toBeDefined;
    expect(counter.pipe).toBeDefined;
  });

  it('force triggers subscribers using update method with a function that returns void', () => {
    const s = signal(
      {} as {
        a?: number;
      }
    );

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(value).toBe(undefined);

    s.update((value) => {
      value.a = 1;
    });

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(1);

    s.update((value) => {
      value.a = 2;
    });

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(2);

    s.set(s.value);

    expect(subscriber).toHaveBeenCalledTimes(3);
  });

  it('force triggers subscribers using emit method without arguments', () => {
    const s = signal(
      {} as {
        a?: number;
      }
    );

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(undefined);

    s.value.a = 1;
    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.value.a = 2;
    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.value);

    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('force triggers dependent subscribers using emit method without arguments', () => {
    const s = signal(
      {} as {
        a?: number;
      }
    );
    const comp = signal((get) => get(s).a || null, {
      equal: false,
    });

    let value: any;

    const subscriber = jest.fn((v: any) => {
      value = v;
    });

    comp.subscribe(subscriber);

    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(null);

    s.value.a = 1;
    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.value.a = 2;
    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.value);

    expect(value).toBe(2);
    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('force triggers subscribers using emit method', () => {
    const s = signal(
      {} as {
        a?: number;
      }
    );

    let value: any;
    const subscriber = jest.fn((v: any) => (value = v.a));

    s.subscribe(subscriber);

    s.emit();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(value).toBe(undefined);

    s.value.a = 1;
    s.emit(s.value);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(value).toBe(1);

    s.value.a = 2;
    s.emit(s.value);

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(value).toBe(2);

    s.set(s.value);

    expect(subscriber).toHaveBeenCalledTimes(4);
  });

  it('force triggers subscribers using emit method without arguments', () => {
    const spy = jest.fn();
    const event = signal(null);

    event.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    event.emit();
    expect(spy).toHaveBeenCalledTimes(2);

    event.emit();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('can not emit undefined value', () => {
    const s = signal<any>();
    const spy = jest.fn();

    s.subscribe(spy, false);
    s.emit(undefined);

    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('keeps subscriptions made inside a subscriber', () => {
    const spy = jest.fn();
    const a = signal(0);
    const b = signal(0);

    a.subscribe(() => {
      b.subscribe(() => spy());
    });

    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    b.set(1);
    expect(spy).toHaveBeenCalledTimes(4);

    b.set(2);
    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('can have fn value', () => {
    const a = () => {};
    const b = () => {};
    const fn = new WritableSignal(a);

    expect(fn.value).toBe(a);

    fn.set(b);
    expect(fn.value).toBe(b);
  });

  it('ignores a new value if it is equal to the current value', () => {
    const a = signal(0);
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not ignore any new value if the equal is set to false', () => {
    const a = signal(0, {
      equal: false,
    });
    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('can use custom equality function', () => {
    const a = signal(0, {
      equal(value) {
        return value >= 5;
      },
    });

    const spy = jest.fn();

    a.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    a.set(0);
    expect(spy).toHaveBeenCalledTimes(2);

    a.set(1);
    expect(spy).toHaveBeenCalledTimes(3);

    a.set(5);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(a.value).toBe(1);

    a.set(2);
    expect(spy).toHaveBeenCalledTimes(4);
  });
});
