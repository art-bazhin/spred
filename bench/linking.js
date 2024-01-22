import {
  signal as preactSignal,
  computed as preactComputed,
  batch as preactBatch,
  effect as preactEffect,
} from '../node_modules/@preact/signals-core/dist/signals-core.mjs';

import { batch, signal } from '/dist/index.mjs';

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
  const H = subscribe(G, (v) => res.push(hard(v, 'H')));
  const I = subscribe(G, (v) => res.push(v));
  const J = subscribe(F, (v) => res.push(hard(v, 'J')));

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

  for (let i = 0; i < 10000; i++) {
    iteration(i);
  }

  const time = performance.now() - ts;

  H(), I(), J();

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
