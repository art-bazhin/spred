import {
  atom,
  computed as computedNano,
} from 'https://unpkg.com/nanostores@0.5.12/index.js';

import {
  createStore,
  createEvent,
  combine,
} from 'https://unpkg.com/effector@22.1.2/effector.mjs';

import {
  createSignal as solidCreateSignal,
  createMemo as solidCreateMemo,
  createComputed as solidCreateComputed,
  batch as solidBatch,
} from 'https://unpkg.com/solid-js@1.3.13/dist/solid.js';

import { createMemo, createWritable, batch } from '/dist/index.mjs';

window.process = {
  env: {
    NODE_ENV: 'production',
  },
};

const subscriber = function () {};

const createCell = cellx.cellx;

window.testAct = (n) => {
  const arr = [];

  for (let i = 0; i < n; i++) {
    arr.push(createWritable(0));
  }

  const res = createMemo(() => arr.map((v) => v()));

  res.subscribe(() => {});
  // res._state.xxx = 1;

  const ts = performance.now();

  arr[0](arr[0]() + 1);

  return performance.now() - ts;
};

const resultDiv = document.getElementById('result');
const runButton = document.getElementById('run');

function getParameter(inputId) {
  if (inputId === 'lib') {
    return document.querySelector('input:checked').value;
  }

  const input = document.getElementById(inputId);

  const value = input.value || 1;
  input.value = value;

  return value;
}

function testCellx(layerCount, newValues) {
  const report = { name: 'cellx' };
  const initTimestamp = performance.now();

  const start = {
    prop1: createCell(1),
    prop2: createCell(2),
    prop3: createCell(3),
    prop4: createCell(4),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: createCell(function () {
          return m.prop2();
        }),
        prop2: createCell(function () {
          return m.prop1() - m.prop3();
        }),
        prop3: createCell(function () {
          return m.prop2() + m.prop4();
        }),
        prop4: createCell(function () {
          return m.prop3();
        }),
      };

      s.prop1.on('change', subscriber);
      s.prop2.on('change', subscriber);
      s.prop3.on('change', subscriber);
      s.prop4.on('change', subscriber);

      return s;
    })(layer);
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  const st = performance.now();

  start.prop1(newValues[0]);
  start.prop2(newValues[1]);
  start.prop3(newValues[2]);
  start.prop4(newValues[3]);

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  report.recalcTime = performance.now() - st;

  return report;
}

function testSpred(layerCount, newValues) {
  const report = { name: 'spred' };
  const initTimestamp = performance.now();

  const start = {
    prop1: createWritable(1),
    prop2: createWritable(2),
    prop3: createWritable(3),
    prop4: createWritable(4),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: createMemo(function () {
          return m.prop2();
        }),
        prop2: createMemo(function () {
          return m.prop1() - m.prop3();
        }),
        prop3: createMemo(function () {
          return m.prop2() + m.prop4();
        }),
        prop4: createMemo(function () {
          return m.prop3();
        }),
      };

      s.prop1.subscribe(subscriber);
      s.prop2.subscribe(subscriber);
      s.prop3.subscribe(subscriber);
      s.prop4.subscribe(subscriber);

      return s;
    })(layer);
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  const st = performance.now();

  batch(() => {
    start.prop1(newValues[0]);
    start.prop2(newValues[1]);
    start.prop3(newValues[2]);
    start.prop4(newValues[3]);
  });

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  report.recalcTime = performance.now() - st;

  return report;
}

function testEffector(layerCount, newValues) {
  const report = { name: 'effector' };
  const initTimestamp = performance.now();

  const set1 = createEvent();
  const set2 = createEvent();
  const set3 = createEvent();
  const set4 = createEvent();

  const start = {
    prop1: createStore(1).on(set1, (_, v) => v),
    prop2: createStore(2).on(set2, (_, v) => v),
    prop3: createStore(3).on(set3, (_, v) => v),
    prop4: createStore(4).on(set4, (_, v) => v),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: combine([m.prop2], function ([prop2]) {
          return prop2;
        }),
        prop2: combine([m.prop1, m.prop3], function ([prop1, prop3]) {
          return prop1 - prop3;
        }),
        prop3: combine([m.prop2, m.prop4], function ([prop2, prop4]) {
          return prop2 + prop4;
        }),
        prop4: combine([m.prop3], function ([prop3]) {
          return prop3;
        }),
      };

      s.prop1.watch(subscriber);
      s.prop2.watch(subscriber);
      s.prop3.watch(subscriber);
      s.prop4.watch(subscriber);

      return s;
    })(layer);
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [
    end.prop1.getState(),
    end.prop2.getState(),
    end.prop3.getState(),
    end.prop4.getState(),
  ];

  const st = performance.now();

  set1(newValues[0]);
  set2(newValues[1]);
  set3(newValues[2]);
  set4(newValues[3]);

  report.afterChange = [
    end.prop1.getState(),
    end.prop2.getState(),
    end.prop3.getState(),
    end.prop4.getState(),
  ];

  report.recalcTime = performance.now() - st;

  return report;
}

function testNanostores(layerCount, newValues) {
  const report = { name: 'nanostores' };
  const initTimestamp = performance.now();

  const start = {
    prop1: atom(1),
    prop2: atom(2),
    prop3: atom(3),
    prop4: atom(4),
  };

  let layer = start;

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

      s.prop1.subscribe(subscriber);
      s.prop2.subscribe(subscriber);
      s.prop3.subscribe(subscriber);
      s.prop4.subscribe(subscriber);

      return s;
    })(layer);
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

function testSolid(layerCount, newValues) {
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

  let layer = start;

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

      solidCreateComputed(s.prop1);
      solidCreateComputed(s.prop2);
      solidCreateComputed(s.prop3);
      solidCreateComputed(s.prop4);

      return s;
    })(layer);
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

function testLib(testFn, layers, iterations, newValues) {
  let totalTimeRecalc = 0;
  let minRecalc = Infinity;
  let maxRecalc = 0;
  let resultRecalc = null;

  let totalTimeInit = 0;
  let minInit = Infinity;
  let maxInit = 0;
  let resultInit = null;
  let name;

  const initArr = [];
  const recalcArr = [];

  for (let i = 0; i < iterations; i++) {
    const report = testFn(layers, newValues);
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

  initArr.sort();
  recalcArr.sort();

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
  const layers = getParameter('layers');
  const lib = getParameter('lib');

  const newValues = [4, 3, 2, 1];

  setTimeout(() => {
    const testFn = {
      spred: testSpred,
      cellx: testCellx,
      solid: testSolid,
      nanostores: testNanostores,
      effector: testEffector,
    }[lib];

    const report = testLib(testFn, layers, iterations, newValues);

    drawTables();

    const recalcTable = document.getElementById('recalcTable');
    const initTable = document.getElementById('initTable');

    recalcTable.appendChild(createTableRow(report.recalc));
    initTable.appendChild(createTableRow(report.init));
  }, 0);
}

runButton.addEventListener('click', runBenchmark);
