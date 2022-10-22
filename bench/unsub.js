import { computed, writable } from '/dist/index.mjs';

const COUNT = 20000;

const button = document.getElementById('run');
const resultEl = document.getElementById('result');

const signals = [];
const unsubs = [];

const subscriber = () => {};

const value = writable(0);

for (let i = 0; i < COUNT; i++) {
  const x2Value = computed(() => value() * 2);
  const x4Value = computed(() => x2Value() * 2);
  const x8Value = computed(() => x4Value() * 2);

  x8Value();

  signals.push(x8Value);
}

function bench() {
  const subTimeStamp = performance.now();

  for (let signal of signals) {
    unsubs.push(signal.subscribe(subscriber));
  }

  const subTime = performance.now() - subTimeStamp;

  const unsubTimeStamp = performance.now();

  for (let unsub of unsubs) {
    unsub();
  }

  const unsubTime = performance.now() - unsubTimeStamp;

  unsubs.length = 0;

  resultEl.textContent = `SUB TIME: ${Math.round(
    subTime
  )}; UNSUB TIME: ${Math.round(unsubTime)}`;
}

button.addEventListener('click', bench);
