// import {
//   createSignal as solidCreateSignal,
//   createMemo as solidCreateMemo,
//   batch as solidBatch,
// } from 'https://unpkg.com/solid-js@1.8.12/dist/solid.js';

import {
  signal as preactSignal,
  computed as preactComputed,
  batch as preactBatch,
  effect as preactEffect,
} from '../node_modules/@preact/signals-core/dist/signals-core.mjs';

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

const LIB_CONFIGS = {
  spred: {
    lib: 'spred',
    track: (s, g) => g(s),
    get: (s) => s.value,
    set: (s, v) => s.set(v),
    subscribe: (s, cb) => s.subscribe(cb),
    writable: signal,
    computed: signal,
    batch,
  },

  preact: {
    lib: 'preact',
    track: (s) => s.value,
    get: (s) => s.value,
    set: (s, v) => (s.value = v),
    subscribe: (s, cb) => s.subscribe(cb),
    writable: preactSignal,
    computed: preactComputed,
    batch: preactBatch,
  },

  // solid: {
  //   lib: 'solid',
  //   track: (s) => s(),
  //   get: (s) => s(),
  //   set: (s, v) => s[1](v),
  //   subscribe: () => {},
  //   writable: solidCreateSignal,
  //   computed: solidCreateMemo,
  //   batch: solidBatch,
  //   mapWritableToComputed: (tuple) => tuple[0],
  // },

  alien: {
    lib: 'alien',
    track: (s) => s(),
    get: (s) => s(),
    set: (s, v) => s(v),
    subscribe: (s, cb) => alienEffect(() => cb(s())),
    writable: alienSignal,
    computed: alienComputed,
    batch: alienBatch,
  },
};

const subscriber = function () {};
const resultDiv = document.getElementById('result');
const hashParams = getHashParams();

init();

function benchIteration({
  lib,
  track,
  get,
  set,
  subscribe,
  writable,
  computed,
  batch,
  width,
  depth,
  relinkRate,
  mapWritableToComputed,
}) {
  const report = { lib };
  const initTimestamp = performance.now();

  const source = {
    prop1: writable(1),
    prop2: writable(2),
    prop3: writable(3),
    prop4: writable(4),
  };

  const tumblerSource = writable(false);

  const tumbler = mapWritableToComputed
    ? mapWritableToComputed(tumblerSource)
    : tumblerSource;

  const start = mapWritableToComputed
    ? {
        prop1: mapWritableToComputed(source.prop1),
        prop2: mapWritableToComputed(source.prop2),
        prop3: mapWritableToComputed(source.prop3),
        prop4: mapWritableToComputed(source.prop4),
      }
    : source;

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = depth; i--; ) {
      const shouldRelink = (depth - i) % relinkRate === 0;

      layer = (function (m) {
        const s = {
          prop1: computed(function (get) {
            if (shouldRelink && track(tumbler, get)) return track(m.prop1, get);
            return track(m.prop2, get);
          }),
          prop2: computed(function (get) {
            if (shouldRelink && track(tumbler, get)) return track(m.prop2, get);
            return track(m.prop1, get) - track(m.prop3, get);
          }),
          prop3: computed(function (get) {
            if (shouldRelink && track(tumbler, get)) return track(m.prop3, get);
            return track(m.prop2, get) + track(m.prop4, get);
          }),
          prop4: computed(function (get) {
            if (shouldRelink && track(tumbler, get)) return track(m.prop4, get);
            return track(m.prop3, get);
          }),
        };

        if (!i) {
          subscribe(s.prop1, subscriber);
          subscribe(s.prop2, subscriber);
          subscribe(s.prop3, subscriber);
          subscribe(s.prop4, subscriber);
          // get(s.prop1);
          // get(s.prop2);
          // get(s.prop3);
          // get(s.prop4);
        }

        return s;
      })(layer);
    }
  }

  const end = layer;

  report.initResult = [
    get(end.prop1),
    get(end.prop2),
    get(end.prop3),
    get(end.prop4),
  ];

  const recalcTimestamp = performance.now();

  report.init = recalcTimestamp - initTimestamp;

  batch(() => {
    set(source.prop1, 4);
    set(source.prop2, 3);
    set(source.prop3, 2);
    set(source.prop4, 1);
  });

  report.recalcResult = [
    get(end.prop1),
    get(end.prop2),
    get(end.prop3),
    get(end.prop4),
  ];

  const relinkTimestamp = performance.now();

  report.recalc = relinkTimestamp - recalcTimestamp;

  set(tumblerSource, true);

  report.relinkResult = [
    get(end.prop1),
    get(end.prop2),
    get(end.prop3),
    get(end.prop4),
  ];

  const endTimestamp = performance.now();

  report.relink = endTimestamp - relinkTimestamp;
  report.total = endTimestamp - initTimestamp;

  return report;
}

function benchLib(config) {
  const { iterations, lib } = config;

  const stats = ['total', 'init', 'recalc', 'relink'].reduce((acc, period) => {
    acc[period] = {
      lib,
      data: [],
      time: 0,
    };

    return acc;
  }, {});

  let report;

  for (let i = 0; i < iterations; i++) {
    report = benchIteration(config);

    for (let period in stats) {
      const periodStats = stats[period];

      periodStats.data.push(report[period]);
      periodStats.time += report[period];
    }
  }

  const middle = Math.floor(iterations / 2);

  for (let period in stats) {
    const data = stats[period].data;
    const time = stats[period].time;

    data.sort((a, b) => a - b);

    stats[period].result = report[period + 'Result'];
    stats[period].min = data[0];
    stats[period].max = data[iterations - 1];
    stats[period].med = data[middle];
    stats[period].avg = time / iterations;
    stats[period].freq = (1000 * iterations) / time;
  }

  return stats;
}

function getHashParams() {
  const str = location.hash.substring(1);

  if (!str) return {};

  return str
    .split('&')
    .map((str) => str.split('='))
    .reduce((acc, cur) => {
      acc[cur[0]] = cur[1];
      return acc;
    }, {});
}

function setHashParams(obj) {
  let str = '';

  for (let key in obj) {
    if (str) str += '&';
    str += key + '=' + obj[key];
  }

  location.hash = str;
}

function getParameter(inputId) {
  const input = document.getElementById(inputId);

  const value = input.value || 1;
  input.value = value;

  return value;
}

function getTableHTML(period) {
  return `
    <div class="m">
      <b>${period}</b>
    </div>
    
    <table id="${period}" class="l">
      <tr>
        <th>Lib</th>
        <th>Avg</th>
        <th>Med</th>
        <th>Min</th>
        <th>Max</th>
        <th>Freq</th>
        <th>Values</th>
      </tr>
    </table>
  `;
}

function createTableRow(libReport) {
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${libReport.lib}</td>
    <td>${formatTime(libReport.avg)}</td>
    <td>${formatTime(libReport.med)}</td>
    <td>${formatTime(libReport.min)}</td>
    <td>${formatTime(libReport.max)}</td>
    <td>${formatNumber(libReport.freq)}</td>
    <td>${libReport.result}</td>`;

  return row;
}

function formatTime(time) {
  const result = Math.round(time * 100) / 100;
  return result.toFixed(2);
}

function formatNumber(num) {
  return Math.round(num);
}

function runBenchmark() {
  resultDiv.innerHTML = 'BENCHMARKING...';

  const params = {
    lib: this.textContent,
    iterations: getParameter('iterations'),
    width: getParameter('width'),
    depth: getParameter('depth'),
    relinkRate: getParameter('relinkRate'),
  };

  setTimeout(() => {
    const config = Object.assign({}, params, LIB_CONFIGS[params.lib]);
    const stats = benchLib(config);

    resultDiv.innerHTML = Object.keys(stats).reduce(
      (html, period) => (html += getTableHTML(period)),
      ''
    );

    for (let period in stats) {
      document
        .getElementById(period)
        .appendChild(createTableRow(stats[period]));
    }

    console.log(stats);
  }, 0);
}

function init() {
  window.process = {
    env: {
      NODE_ENV: 'production',
    },
  };

  document.querySelectorAll('input[type="number"]').forEach((input) => {
    if (hashParams[input.id]) input.value = hashParams[input.id];
    else hashParams[input.id] = input.value;

    input.addEventListener('input', ({ target }) => {
      hashParams[target.id] = target.value;
      setHashParams(hashParams);
    });

    setHashParams(hashParams);
  });

  document.querySelectorAll('button').forEach((button) => {
    button.onclick = runBenchmark;
  });

  for (let lib in LIB_CONFIGS) {
    const button = document.createElement('button');

    button.textContent = lib;
    button.onclick = runBenchmark;

    document.getElementById('buttons').appendChild(button);
    document
      .getElementById('buttons')
      .appendChild(document.createTextNode(' '));
  }
}

const a = signal(0);

const b = signal((get) => get(a) + get(a) + get(a));

b.subscribe(() => {});

console.log(b);
