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

// const cellx = {};

import {
  signal as preactSignal,
  computed as preactComputed,
  batch as preactBatch,
  effect as preactEffect,
} from '../node_modules/@preact/signals-core/dist/signals-core.mjs';

import { computed, writable, batch } from '/dist/index.mjs';

act = act.act;

window.process = {
  env: {
    NODE_ENV: 'production',
  },
};

const subscriber = function () {};

const createCell = cellx.cellx;
const Cell = cellx.Cell;

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
    prop1: new Cell(1),
    prop2: new Cell(2),
    prop3: new Cell(3),
    prop4: new Cell(4),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: new Cell(function () {
          return m.prop2.get();
        }),
        prop2: new Cell(function () {
          return m.prop1.get() - m.prop3.get();
        }),
        prop3: new Cell(function () {
          return m.prop2.get() + m.prop4.get();
        }),
        prop4: new Cell(function () {
          return m.prop3.get();
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

function testPreact(layerCount, newValues) {
  const report = { name: 'preact' };
  const initTimestamp = performance.now();

  const start = {
    prop1: preactSignal(1),
    prop2: preactSignal(2),
    prop3: preactSignal(3),
    prop4: preactSignal(4),
  };

  let layer = start;

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

function testSpred(layerCount, newValues) {
  const report = { name: 'spred' };
  const initTimestamp = performance.now();

  const start = {
    prop1: writable(1),
    prop2: writable(2),
    prop3: writable(3),
    prop4: writable(4),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: computed(function () {
          return m.prop2();
        }),
        prop2: computed(function () {
          return m.prop1() - m.prop3();
        }),
        prop3: computed(function () {
          return m.prop2() + m.prop4();
        }),
        prop4: computed(function () {
          return m.prop3();
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

function testAct(layerCount, newValues) {
  const report = { name: 'act' };
  const initTimestamp = performance.now();

  const start = {
    prop1: act(1),
    prop2: act(2),
    prop3: act(3),
    prop4: act(4),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: act(function () {
          return m.prop2();
        }),
        prop2: act(function () {
          return m.prop1() - m.prop3();
        }),
        prop3: act(function () {
          return m.prop2() + m.prop4();
        }),
        prop4: act(function () {
          return m.prop3();
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

      if (!i) {
        s.prop1.watch(subscriber);
        s.prop2.watch(subscriber);
        s.prop3.watch(subscriber);
        s.prop4.watch(subscriber);
      }

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

      if (!i) {
        s.prop1.subscribe(subscriber);
        s.prop2.subscribe(subscriber);
        s.prop3.subscribe(subscriber);
        s.prop4.subscribe(subscriber);
      }

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

      // if (!i) {
      // solidCreateComputed(s.prop1);
      // solidCreateComputed(s.prop2);
      // solidCreateComputed(s.prop3);
      // solidCreateComputed(s.prop4);
      // }

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
  let resultRecalc = null;

  let totalTimeInit = 0;
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
  const layers = getParameter('layers');
  const lib = getParameter('lib');

  const newValues = [4, 3, 2, 1];

  setTimeout(() => {
    const testFn = {
      spred: testSpred,
      act: testAct,
      preact: testPreact,
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
