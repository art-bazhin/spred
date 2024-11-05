let globalVersion = 1;
let tracking: Signal<any> | null = null;

interface Link<T> {
  value: T | null;
  next: Link<T> | null;
}

class Signal<T> {
  _version = 0;
  _updated = 0;

  _value: T = undefined as any;
  _nextValue: T = undefined as any;

  _source: Link<Signal<any>> = {
    value: null,
    next: null,
  };

  _compute: ((g: typeof get) => T) | null = null;

  constructor(compute: (g: typeof get) => T) {
    this._compute = compute;
  }

  get value() {
    return get(this, false);
  }

  subscribe() {
    this.value;
    return () => {};
  }
}

function recalc(signal: Signal<any>) {
  if (signal._version !== globalVersion) {
    let shouldCompute = false;

    for (
      let link: Link<Signal<any>> | null = signal._source;
      link!.value !== null;
      link = link!.next
    ) {
      const source = link!.value!;

      recalc(source);

      if (source._updated === globalVersion) {
        shouldCompute = true;
        break;
      }
    }

    if (signal._source.value === null) {
      shouldCompute = true;
    }

    if (shouldCompute) {
      const tempTracking = tracking;
      const firstSource = signal?._source;

      tracking = signal;

      const nextValue = signal._compute
        ? signal._compute!(get)
        : signal._nextValue;

      if (nextValue !== signal._value) {
        signal._value = nextValue;
        signal._updated = globalVersion;
      }

      signal._source.value = null;
      signal._source.next = null;
      signal._source = firstSource;

      tracking = tempTracking;
    }

    signal._version = globalVersion;
  }

  return signal._value;
}

class WritableSignal<T> extends Signal<T> {
  constructor(initialValue: T) {
    super(null as any);
    this._nextValue = initialValue;
  }

  set(value: T) {
    ++globalVersion;
    this._nextValue = value;
  }
}

function signal<T>(value?: any) {
  if (typeof value === 'function') return new Signal(value);
  return new WritableSignal(value);
}

function batch(cb: () => void) {
  cb();
}

function get<T>(signal: Signal<T>, track = true) {
  if (track && tracking) {
    if (tracking._source.value !== signal) {
      tracking._source.value = signal;
    }

    if (!tracking._source.next) {
      tracking._source.next = {
        value: null,
        next: null,
      };
    }

    tracking._source = tracking._source.next;
  }

  return recalc(signal);
}

export const v2 = {
  Signal,
  WritableSignal,
  signal,
  batch,
};
