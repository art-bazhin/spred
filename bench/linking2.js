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

import {
  signal as alienSignal,
  computed as alienComputed,
  effect as alienEffect,
  startBatch,
  endBatch,
} from '../node_modules/alien-signals/esm/index.mjs';

import { batch, signal } from '/dist/index.mjs';

const alienBatch = (cb) => {
  startBatch();
  cb();
  endBatch();
};

const NUMBER_OF_ITERATIONS = 100_000;

const res = [];

const numbers = Array.from({ length: 30 }, (_, i) => i);

const fib = (n) => (n < 2 ? 1 : fib(n - 1) + fib(n - 2));

const hard = (n, l) => n + fib(2);

const SIZE = 100;

function bench(writable, computed, get, set, subscribe, batch) {
  // 1) Источники: переключатель + 200 числовых сигналов
  const T = writable(false);
  const nums = Array.from({ length: SIZE * 2 }, (_, i) =>
    writable(i < SIZE ? 1 : 2)
  );

  // 2) Вычисление: сумма первой или второй сотни в зависимости от T
  const SUM = computed((g) => {
    const t = get(T, g);
    let s = 0;
    if (!t) {
      // суммируем индексы [0..99]
      for (let i = 0; i < SIZE; i++) s += get(nums[i], g);
    } else {
      // суммируем индексы [100..199]
      for (let i = SIZE; i < SIZE * 2; i++) s += get(nums[i], g);
    }
    return s;
  });

  let sum;

  // 3) Подписка, чтобы SUM был активным
  const unsub = subscribe(SUM, (v) => {
    sum = v;
  });

  // 4) Итерация: просто переключаем T, чтобы сломать "старый порядок" зависимостей
  function iteration(i) {
    batch(() => {
      set(T, (i & 1) === 1); // false -> true -> false -> ...
    });
  }

  // 5) Прогон и замер
  const t0 = performance.now();
  for (let i = 0; i < NUMBER_OF_ITERATIONS; i++) {
    iteration(i);
  }
  const dt = performance.now() - t0;

  // 6) Очистка подписки (если библиотека возвращает функцию)
  if (typeof unsub === 'function') {
    unsub();
  }

  // 7) Для контроля выведем итоговое значение и время
  const finalSum =
    document.getElementById('finalSum') ||
    (() => {
      const span = document.createElement('span');
      span.id = 'finalSum';
      document.getElementById('result').insertAdjacentElement('afterend', span);
      return span;
    })();

  finalSum.textContent = ` (SUM=${sum})`;
  document.getElementById('result').textContent = Math.round(dt);
}

document.getElementById('spred').onclick = () => {
  bench(
    signal,
    signal,
    (s, g) => g(s),
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

document.getElementById('alien').onclick = () => {
  bench(
    alienSignal,
    alienComputed,
    (s) => s(),
    (s, v) => s(v),
    (s, f) => alienEffect(() => f(s())),
    alienBatch
  );
};
