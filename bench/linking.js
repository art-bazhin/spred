import {
  signal as preactSignal,
  computed as preactComputed,
  batch as preactBatch,
  effect as preactEffect,
} from '../node_modules/@preact/signals-core/dist/signals-core.mjs';

import {
  createSignal as solidSignal,
  createMemo as solidMemo,
  createEffect as solidEffect,
  batch as solidBatch,
} from 'https://unpkg.com/solid-js@1.8.0/dist/solid.js';

import {
  observable as whatsupObservable,
  computed as whatsupComputed,
  autorun as whatsupEffect,
  runInAction as whatsupBatch,
} from 'https://unpkg.com/@whatsup/core@2.6.0/dist/index.esm.js';

import { batch, signal } from '/dist/index.mjs';

const NUMBER_OF_ITERATIONS = 100_000;

const res = [];

const numbers = Array.from({ length: 5 }, (_, i) => i);

const fib = (n) => (n < 2 ? 1 : fib(n - 1) + fib(n - 2));

const hard = (n, l) => n + fib(2);

function bench(writable, computed, get, set, subscribe, batch) {
  const A = writable(0);
  const B = writable(0);
  const C = computed(() => (get(A) % 2) + (get(B) % 2));
  const D = computed(() =>
    numbers.map((i) => ({ x: i + (get(A) % 2) - (get(B) % 2) }))
  );
  const E = computed(() => hard(get(C) + get(A) + get(D)[0].x, 'E'));
  const F = computed(() => hard(get(D)[2].x || get(B), 'F'));
  const G = computed(
    () => get(C) + (get(C) || get(E) % 2) + get(D)[4].x + get(F)
  );

  const H = subscribe(G, (v) => {
    res.push(hard(v, 'H'));
  });

  const I = subscribe(G, (v) => {
    res.push(v);
  });

  const J = subscribe(F, (v) => {
    res.push(hard(v, 'J'));
  });

  function iteration(i) {
    res.length = 0;

    batch(() => {
      set(B, 1);
      set(A, 1 + i * 2);
    });

    batch(() => {
      set(A, 2 + i * 2);
      set(B, 2);
    });
  }

  const ts = performance.now();

  for (let i = 0; i < NUMBER_OF_ITERATIONS; i++) {
    iteration(i);
  }

  const time = performance.now() - ts;

  if (typeof H === 'function') {
    H(), I(), J();
  }

  document.getElementById('result').textContent = `[${res}] ${Math.round(
    time
  )}`;
}

document.getElementById('spred').onclick = () => {
  bench(
    signal,
    signal,
    (s) => s.get(),
    (s, v) => s.set(v),
    (s, f) => s.subscribe(f),
    batch
  );
};

document.getElementById('preact').onclick = () => {
  bench(
    preactSignal,
    preactComputed,
    (s) => s.value,
    (s, v) => {
      s.value = v;
    },
    (s, f) => preactEffect(() => f(s.value)),
    preactBatch
  );
};

document.getElementById('solid').onclick = () => {
  bench(
    solidSignal,
    solidMemo,
    (s) => (typeof s === 'function' ? s() : s[0]()),
    (s, v) => {
      s[1](v);
    },
    (s, f) => solidEffect(() => f(s())),
    solidBatch
  );
};

document.getElementById('whatsup').onclick = () => {
  bench(
    whatsupObservable,
    whatsupComputed,
    (s) => s(),
    (s, v) => s(v),
    (s, f) => whatsupEffect(() => f(s())),
    whatsupBatch
  );
};
