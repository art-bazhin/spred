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

  _recalc() {
    if (this._version !== globalVersion) {
      let shouldCompute = false;

      for (
        let link: Link<Signal<any>> | null = this._source;
        link!.value !== null;
        link = link!.next
      ) {
        const source = link!.value!;

        source._recalc();

        if (source._updated === globalVersion) {
          shouldCompute = true;
          break;
        }
      }

      if (this._source.value === null) {
        shouldCompute = true;
      }

      if (shouldCompute) {
        const tempTracking = tracking;
        const firstSource = this?._source;

        tracking = this;

        const nextValue = this._compute ? this._compute!(get) : this._nextValue;

        if (nextValue !== this._value) {
          this._value = nextValue;
          this._updated = globalVersion;
        }

        this._source.value = null;
        this._source.next = null;
        this._source = firstSource;

        tracking = tempTracking;
      }

      this._version = globalVersion;
    }

    return this._value;
  }
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

  return signal._recalc();
}

export const v2 = {
  Signal,
  WritableSignal,
  signal,
  batch,
};
