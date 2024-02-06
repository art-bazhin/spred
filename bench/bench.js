import {
  atom,
  computed as computedNano,
} from 'https://unpkg.com/nanostores@0.9.5/index.js';

import {
  createSignal as solidCreateSignal,
  createMemo as solidCreateMemo,
  batch as solidBatch,
} from 'https://unpkg.com/solid-js@1.8.12/dist/solid.js';

import {
  signal as preactSignal,
  computed as preactComputed,
  batch as preactBatch,
  effect as preactEffect,
} from '../node_modules/@preact/signals-core/dist/signals-core.mjs';

import {
  observable as whatsupObservable,
  computed as whatsupComputed,
  autorun as whatsupEffect,
  runInAction as whatsupBatch,
} from 'https://unpkg.com/@whatsup/core@2.6.0/dist/index.esm.js';

import {
  signal as maverickSignal,
  computed as maverickComputed,
  effect as maverickEffect,
  tick,
} from 'https://esm.sh/@maverick-js/signals@5.11.4';

import {
  computed,
  writable,
  batch,
  signal,
  configure,
  isWritableSignal,
  isSignal,
} from '/dist/index.mjs';

window.process = {
  env: {
    NODE_ENV: 'production',
  },
};

const subscriber = function () {};

const resultDiv = document.getElementById('result');

const params = getHashParams();

document.querySelectorAll('input[type="number"]').forEach((input) => {
  if (params[input.id]) input.value = params[input.id];
  else params[input.id] = input.value;

  input.addEventListener('input', ({ target }) => {
    params[target.id] = target.value;
    setHashParams(params);
  });

  setHashParams(params);
});

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
  if (inputId === 'lib') {
    return document.querySelector('input:checked').value;
  }

  const input = document.getElementById(inputId);

  const value = input.value || 1;
  input.value = value;

  return value;
}

function testPreact(width, layerCount, newValues) {
  const report = { name: 'preact' };
  const initTimestamp = performance.now();

  const start = {
    prop1: preactSignal(1),
    prop2: preactSignal(2),
    prop3: preactSignal(3),
    prop4: preactSignal(4),
  };

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = layerCount; i--; ) {
      layer = (function (m) {
        const s = {
          prop1: preactComputed(function () {
            return m.prop2.value;
          }),
          prop2: preactComputed(function () {
            return m.prop1.value - m.prop3.value;
          }),
          prop3: preactComputed(function () {
            return m.prop2.value + m.prop4.value;
          }),
          prop4: preactComputed(function () {
            return m.prop3.value;
          }),
        };

        if (!i) {
          preactEffect(() => s.prop1.value);
          preactEffect(() => s.prop2.value);
          preactEffect(() => s.prop3.value);
          preactEffect(() => s.prop4.value);
        }

        return s;
      })(layer);
    }
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [
    end.prop1.value,
    end.prop2.value,
    end.prop3.value,
    end.prop4.value,
  ];

  const st = performance.now();

  preactBatch(() => {
    start.prop1.value = newValues[0];
    start.prop2.value = newValues[1];
    start.prop3.value = newValues[2];
    start.prop4.value = newValues[3];
  });

  report.afterChange = [
    end.prop1.value,
    end.prop2.value,
    end.prop3.value,
    end.prop4.value,
  ];

  report.recalcTime = performance.now() - st;

  return report;
}

function testWhatsup(width, layerCount, newValues) {
  const report = { name: 'whatsup' };
  const initTimestamp = performance.now();

  const start = {
    prop1: whatsupObservable(1),
    prop2: whatsupObservable(2),
    prop3: whatsupObservable(3),
    prop4: whatsupObservable(4),
  };

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = layerCount; i--; ) {
      layer = (function (m) {
        const s = {
          prop1: whatsupComputed(function () {
            return m.prop2();
          }),
          prop2: whatsupComputed(function () {
            return m.prop1() - m.prop3();
          }),
          prop3: whatsupComputed(function () {
            return m.prop2() + m.prop4();
          }),
          prop4: whatsupComputed(function () {
            return m.prop3();
          }),
        };

        if (!i) {
          whatsupEffect(() => s.prop1());
          whatsupEffect(() => s.prop2());
          whatsupEffect(() => s.prop3());
          whatsupEffect(() => s.prop4());
        }

        return s;
      })(layer);
    }
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  const st = performance.now();

  whatsupBatch(() => {
    start.prop1(newValues[0]);
    start.prop2(newValues[1]);
    start.prop3(newValues[2]);
    start.prop4(newValues[3]);
  });

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  report.recalcTime = performance.now() - st;

  return report;
}

function testMaverick(width, layerCount, newValues) {
  const report = { name: 'maverick' };
  const initTimestamp = performance.now();

  const start = {
    prop1: maverickSignal(1),
    prop2: maverickSignal(2),
    prop3: maverickSignal(3),
    prop4: maverickSignal(4),
  };

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = layerCount; i--; ) {
      layer = (function (m) {
        const s = {
          prop1: maverickComputed(function () {
            return m.prop2();
          }),
          prop2: maverickComputed(function () {
            return m.prop1() - m.prop3();
          }),
          prop3: maverickComputed(function () {
            return m.prop2() + m.prop4();
          }),
          prop4: maverickComputed(function () {
            return m.prop3();
          }),
        };

        if (!i) {
          maverickEffect(() => s.prop1());
          maverickEffect(() => s.prop2());
          maverickEffect(() => s.prop3());
          maverickEffect(() => s.prop4());
        }

        return s;
      })(layer);
    }
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];
  tick();

  const st = performance.now();

  start.prop1.set(newValues[0]);
  start.prop2.set(newValues[1]);
  start.prop3.set(newValues[2]);
  start.prop4.set(newValues[3]);
  tick();

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];
  tick();

  report.recalcTime = performance.now() - st;

  return report;
}

function testSpred(width, layerCount, newValues) {
  const report = { name: 'spred' };
  const initTimestamp = performance.now();

  const start = {
    prop1: signal(1),
    prop2: signal(2),
    prop3: signal(3),
    prop4: signal(4),
  };

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = layerCount; i--; ) {
      layer = (function (m) {
        const s = {
          prop1: signal(function () {
            return m.prop2.get();
          }),
          prop2: signal(function () {
            return m.prop1.get() - m.prop3.get();
          }),
          prop3: signal(function () {
            return m.prop2.get() + m.prop4.get();
          }),
          prop4: signal(function () {
            return m.prop3.get();
          }),
        };

        if (!i) {
          s.prop1.subscribe(subscriber);
          s.prop2.subscribe(subscriber);
          s.prop3.subscribe(subscriber);
          s.prop4.subscribe(subscriber);
        }

        return s;
      })(layer);
    }
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  const st = performance.now();

  batch(() => {
    start.prop1.set(newValues[0]);
    start.prop2.set(newValues[1]);
    start.prop3.set(newValues[2]);
    start.prop4.set(newValues[3]);
  });

  report.afterChange = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  report.recalcTime = performance.now() - st;

  return report;
}

function testNanostores(width, layerCount, newValues) {
  const report = { name: 'nanostores' };
  const initTimestamp = performance.now();

  const start = {
    prop1: atom(1),
    prop2: atom(2),
    prop3: atom(3),
    prop4: atom(4),
  };

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = layerCount; i--; ) {
      layer = (function (m) {
        const s = {
          prop1: computedNano([m.prop2], function (prop2) {
            return prop2;
          }),
          prop2: computedNano([m.prop1, m.prop3], function (prop1, prop3) {
            return prop1 - prop3;
          }),
          prop3: computedNano([m.prop2, m.prop4], function (prop2, prop4) {
            return prop2 + prop4;
          }),
          prop4: computedNano([m.prop3], function (prop3) {
            return prop3;
          }),
        };

        if (!i) {
          s.prop1.subscribe(subscriber);
          s.prop2.subscribe(subscriber);
          s.prop3.subscribe(subscriber);
          s.prop4.subscribe(subscriber);
        }

        return s;
      })(layer);
    }
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  const st = performance.now();

  start.prop1.set(newValues[0]);
  start.prop2.set(newValues[1]);
  start.prop3.set(newValues[2]);
  start.prop4.set(newValues[3]);

  report.afterChange = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  report.recalcTime = performance.now() - st;

  return report;
}

function testSolid(width, layerCount, newValues) {
  const report = { name: 'solid' };
  const initTimestamp = performance.now();

  const signals = {
    prop1: solidCreateSignal(1),
    prop2: solidCreateSignal(2),
    prop3: solidCreateSignal(3),
    prop4: solidCreateSignal(4),
  };

  const start = {
    prop1: signals.prop1[0],
    prop2: signals.prop2[0],
    prop3: signals.prop3[0],
    prop4: signals.prop4[0],
  };

  let layer;

  for (let j = width; j--; ) {
    layer = start;

    for (let i = layerCount; i--; ) {
      layer = (function (m) {
        const s = {
          prop1: solidCreateMemo(function () {
            return m.prop2();
          }),
          prop2: solidCreateMemo(function () {
            return m.prop1() - m.prop3();
          }),
          prop3: solidCreateMemo(function () {
            return m.prop2() + m.prop4();
          }),
          prop4: solidCreateMemo(function () {
            return m.prop3();
          }),
        };

        // if (!i) {
        // solidCreateComputed(s.prop1);
        // solidCreateComputed(s.prop2);
        // solidCreateComputed(s.prop3);
        // solidCreateComputed(s.prop4);
        // }

        return s;
      })(layer);
    }
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  const st = performance.now();

  solidBatch(() => {
    signals.prop1[1](newValues[0]);
    signals.prop2[1](newValues[1]);
    signals.prop3[1](newValues[2]);
    signals.prop4[1](newValues[3]);
  });

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  report.recalcTime = performance.now() - st;

  return report;
}

function testLib(testFn, width, layers, iterations, newValues) {
  let totalTimeRecalc = 0;
  let resultRecalc = null;

  let totalTimeInit = 0;
  let resultInit = null;
  let name;

  const initArr = [];
  const recalcArr = [];

  for (let i = 0; i < iterations; i++) {
    const report = testFn(width, layers, newValues);
    const recalcTime = report.recalcTime;
    const initTime = report.initTime;

    initArr.push(initTime);
    recalcArr.push(recalcTime);

    totalTimeRecalc += report.recalcTime;
    resultRecalc = report.afterChange;

    totalTimeInit += report.initTime;
    resultInit = report.beforeChange;

    name = report.name;
  }

  initArr.sort((a, b) => a - b);
  recalcArr.sort((a, b) => a - b);

  const middle = Math.floor(iterations / 2);

  return {
    init: {
      name,
      result: resultInit,
      min: initArr[0],
      max: initArr[iterations - 1],
      med: initArr[middle],
      avg: totalTimeInit / iterations,
    },

    recalc: {
      name,
      result: resultRecalc,
      min: recalcArr[0],
      max: recalcArr[iterations - 1],
      med: recalcArr[middle],
      avg: totalTimeRecalc / iterations,
    },
  };
}

function drawTables() {
  resultDiv.innerHTML = `
    <div class="m">
      <b>Initialization</b>
    </div>
    
    <table id="initTable" class="l">
      <tr>
        <th>Lib</th>
        <th>Avg</th>
        <th>Med</th>
        <th>Min</th>
        <th>Max</th>
        <th>Values</th>
      </tr>
    </table>

    <div class="m">
      <b>Recalculation</b>
    </div>
    
    <table id="recalcTable">
      <tr>
        <th>Lib</th>
        <th>Avg</th>
        <th>Med</th>
        <th>Min</th>
        <th>Max</th>
        <th>Values</th>
      </tr>
    </table>
  `;
}

function createTableRow(libReport) {
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${libReport.name}</td>
    <td>${formatTime(libReport.avg)}</td>
    <td>${formatTime(libReport.med)}</td>
    <td>${formatTime(libReport.min)}</td>
    <td>${formatTime(libReport.max)}</td>
    <td>${libReport.result}</td>`;

  return row;
}

function formatTime(time) {
  const result = Math.round(time * 100) / 100;
  return result.toFixed(2);
}

function runBenchmark() {
  resultDiv.innerHTML = 'BENCHMARKING...';

  const iterations = getParameter('iterations');
  const width = getParameter('width');
  const layers = getParameter('layers');
  const lib = this.textContent;

  const newValues = [4, 3, 2, 1];

  setTimeout(() => {
    const testFn = {
      spred: testSpred,
      preact: testPreact,
      solid: testSolid,
      whatsup: testWhatsup,
      nanostores: testNanostores,
      maverick: testMaverick,
    }[lib];

    const report = testLib(testFn, width, layers, iterations, newValues);

    drawTables();

    const recalcTable = document.getElementById('recalcTable');
    const initTable = document.getElementById('initTable');

    recalcTable.appendChild(createTableRow(report.recalc));
    initTable.appendChild(createTableRow(report.init));
  }, 0);
}

document.querySelectorAll('button').forEach((button) => {
  button.onclick = runBenchmark;
});

function expect(value) {
  return {
    toBe(v) {
      if (value !== v) {
        console.log(value + ' != ' + v);
      }
    },
  };
}
