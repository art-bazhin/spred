let globalVersion = 1;
let tracking: Signal<any> | null = null;
let batchLevel = 0;

let sources: WritableSignal<any>[] = [];
let targets: Signal<any>[] = [];
let reactions: Link[] = [];

interface Link {
  source: Signal<any> | null;
  target: Signal<any> | ((value: any) => void);

  ns: Link | null;
  pt: Link | null;
  nt: Link | null;
}

class Signal<T> {
  _version = 0;
  _notified = 0;

  _value: T = undefined as any;

  _source: Link = {
    source: null,
    target: this,
    ns: null,
    pt: null,
    nt: null,
  };

  _target: Link | null = null;

  _compute: ((g: typeof get) => T) | null = null;

  constructor(compute: (g: typeof get) => T) {
    this._compute = compute;
  }

  subscribe(cb: (value: T) => void) {
    const value = this.value;

    const link: Link = {
      source: this,
      target: cb,
      ns: null,
      pt: null,
      nt: null,
    };

    addTarget(this, link);

    cb(value);

    return () => {
      if (link.source === null) return;

      link.source = null;
      if (link.pt) link.pt.nt = link.nt;

      // TODO
    };
  }

  get value() {
    if (this._version < globalVersion) {
      if (this._version === -1)
        return (this as any as WritableSignal<T>)._nextValue;

      let shouldCompute = false;

      this._version = globalVersion;

      for (
        let link: Link | null = this._source;
        link!.source !== null;
        link = link!.ns
      ) {
        const source = link!.source!;

        source.value;

        if (source._version === globalVersion + 1) {
          shouldCompute = true;
          break;
        }
      }

      if (this._source.source === null) {
        shouldCompute = true;
      }

      if (shouldCompute) {
        const tempTracking = tracking;
        const firstSource = this?._source;

        tracking = this;

        const nextValue = this._compute
          ? this._compute!(get)
          : (this as any as WritableSignal<T>)._nextValue;

        if (nextValue !== this._value) {
          this._value = nextValue;
          ++this._version;
        }

        this._source.source = null;
        this._source.ns = null;
        this._source = firstSource;

        tracking = tempTracking;
      }
    }

    return this._value;
  }
}

class WritableSignal<T> extends Signal<T> {
  _nextValue: T;

  constructor(initialValue: T) {
    super(null as any);
    this._nextValue = initialValue;
    this._version = -1;
  }

  set(value: T) {
    this._nextValue = value;
    if (this._version === -1) return;
    sources.push(this);
    sync();
  }
}

function addTarget(signal: Signal<any>, link: Link) {
  let lt = signal._target;

  if (lt) lt.nt = link;

  link.pt = lt;
  signal._target = link;

  if (lt) return;

  for (
    let link: Link | null = signal._source;
    link!.source !== null;
    link = link!.ns
  ) {
    addTarget(link!.source!, link!);
  }
}

function notify(signal: Signal<any>) {
  if (signal._notified === globalVersion) return;
  signal._notified = globalVersion;

  let notInTargets = true;

  for (let link: Link | null = signal._target; link !== null; link = link.pt) {
    const target = link.target;
    if (typeof target === 'function') {
      reactions.push(link);

      if (notInTargets) {
        targets.push(signal);
        notInTargets = false;
      }
    } else notify(target);
  }
}

function signal<T>(value?: any) {
  if (typeof value === 'function') return new Signal(value);
  return new WritableSignal(value);
}

function sync() {
  if (batchLevel || !sources.length) return;

  const s = sources;
  sources = [];

  globalVersion += 2;

  for (let source of s) {
    source.value;
    if (source._version === globalVersion + 1) notify(source);
  }

  for (let target of targets) {
    target.value;
  }

  for (let link of reactions) {
    if (link.source) (link.target as any)(link.source._value);
  }

  targets = [];
  reactions = [];

  sync();
}

function batch(cb: () => void) {
  ++batchLevel;
  cb();
  --batchLevel;
  sync();
}

function get<T>(signal: Signal<T>) {
  if (tracking) {
    if (tracking._source.source !== signal) {
      tracking._source.source = signal;
    }

    if (!tracking._source.ns) {
      tracking._source.ns = {
        source: null,
        target: tracking,
        ns: null,
        pt: null,
        nt: null,
      };
    }

    tracking._source = tracking._source.ns;

    if (signal._version === -1) signal._version = 0;
  }

  return signal.value;
}

export const v2 = {
  Signal,
  WritableSignal,
  signal,
  batch,
};
