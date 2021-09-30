const Cell = cellx.Cell;
const createSubject = spred.createSubject;
const createComputed = spred.createComputed;
const commit = spred.commit;

const resultDiv = document.getElementById('result');
const runButton = document.getElementById('run');

function getParameter(inputId) {
  const input = document.getElementById(inputId);

  const value = input.value || 1;
  input.value = value;

  return value;
}

function testCellx(layerCount) {
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

      // if (!i) {
        s.prop1.on('change', function () {});
        s.prop2.on('change', function () {});
        s.prop3.on('change', function () {});
        s.prop4.on('change', function () {});
      // }

      s.prop1.get();
      s.prop2.get();
      s.prop3.get();
      s.prop4.get();

      return s;
    })(layer);
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [
    start.prop1.get(),
    start.prop2.get(),
    start.prop3.get(),
    start.prop4.get(),
  ];

  const st = performance.now();

  start.prop1.set(4);
  start.prop2.set(3);
  start.prop3.set(2);
  start.prop4.set(1);

  report.afterChange = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  report.recalcTime = performance.now() - st;

  return report;
}

function testSpred(layerCount) {
  const report = { name: 'spred' };
  const initTimestamp = performance.now();

  const start = {
    prop1: createSubject(1),
    prop2: createSubject(2),
    prop3: createSubject(3),
    prop4: createSubject(4),
  };

  let layer = start;

  for (let i = layerCount; i--; ) {
    layer = (function (m) {
      const s = {
        prop1: createComputed(function () {
          return m.prop2();
        }),
        prop2: createComputed(function () {
          return m.prop1() - m.prop3();
        }),
        prop3: createComputed(function () {
          return m.prop2() + m.prop4();
        }),
        prop4: createComputed(function () {
          return m.prop3();
        }),
      };

      // if (!i) {
        s.prop1.subscribe(function () {});
        s.prop2.subscribe(function () {});
        s.prop3.subscribe(function () {});
        s.prop4.subscribe(function () {});
      // }

      s.prop1();
      s.prop2();
      s.prop3();
      s.prop4();

      return s;
    })(layer);
  }

  report.initTime = performance.now() - initTimestamp;

  const end = layer;

  report.beforeChange = [start.prop1(), start.prop2(), start.prop3(), start.prop4()];

  const st = performance.now();

  // start.prop1(4);
  // start.prop2(3);
  // start.prop3(2);
  // start.prop4(1);

  commit(
    [start.prop1, 4],
    [start.prop2, 3],
    [start.prop3, 2],
    [start.prop4, 1],
  );

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  report.recalcTime = performance.now() - st;

  return report;
}

function testLib(testFn, layers, iterations) {
  let totalTimeRecalc = 0;
  let minRecalc = Infinity;
  let maxRecalc = 0;
  let resultRecalc = null;

  let totalTimeInit = 0;
  let minInit = Infinity;
  let maxInit = 0;
  let resultInit = null;
  let name;

  for (let i = 0; i < iterations; i++) {
    const report = testFn(layers);
    const recalcTime = report.recalcTime;
    const initTime = report.initTime;

    if (recalcTime < minRecalc) minRecalc = recalcTime;
    if (recalcTime > maxRecalc) maxRecalc = recalcTime;

    if (initTime < minInit) minInit = initTime;
    if (initTime > maxInit) maxInit = initTime;

    totalTimeRecalc += report.recalcTime;
    resultRecalc = report.afterChange;

    totalTimeInit += report.initTime;
    resultInit = report.beforeChange;

    name = report.name;
  }

  return {
    init: {   
      name,   
      result: resultInit,
      min: minInit,
      max: maxInit,
      avg: totalTimeInit / iterations
    },

    recalc: {
      name,
      result: resultRecalc,
      min: minRecalc,
      max: maxRecalc,
      avg: totalTimeRecalc / iterations
    }
  }
}

function drawTables() {
  resultDiv.innerHTML = `
    <div class="m">
      <b>Initialization</b>
    </div>
    
    <table id="initTable" class="l">
      <tr>
        <th>Lib</th>
        <th>Avg%</th>
        <th>Avg</th>
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
        <th>Avg%</th>
        <th>Avg</th>
        <th>Min</th>
        <th>Max</th>
        <th>Values</th>
      </tr>
    </table>
  `;
}

function createTableRow(libReport, minAvg) {
  const row = document.createElement('tr');

  const percent = (
    libReport.avg === 0 ||
    minAvg === 0
  ) ? '-' : Math.round(100 * libReport.avg / minAvg) + '%';

  row.innerHTML = `
    <td>${libReport.name}</td>
    <td>${percent}</td>
    <td>${formatTime(libReport.avg)}</td>
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

  setTimeout(() => {
    const warmup = false;
    const testSet = [
      testSpred,
      //testCellx
    ];
    
    if (warmup) {
      testSet.forEach(test => testLib(test, layers, iterations));
    }
    
    const reportsSortedByRecalc = testSet
      .map(test => testLib(test, layers, iterations))
      .sort((a, b) => a.recalc.avg - b.recalc.avg);

    const reportsSortedByInit = 
      [...reportsSortedByRecalc]
        .sort((a, b) => a.init.avg - b.init.avg);


    drawTables();

    const recalcTable = document.getElementById('recalcTable');
    const minRecalcAvg = reportsSortedByRecalc.sort((a, b) => a.recalc.avg - b.recalc.avg)[0].recalc.avg;

    const initTable = document.getElementById('initTable');
    const minInitAvg = reportsSortedByInit.sort((a, b) => a.init.avg - b.init.avg)[0].init.avg;

    reportsSortedByRecalc.forEach(
      report => 
        report.recalc.name && 
        recalcTable.appendChild(createTableRow(report.recalc, minRecalcAvg))
    );

    reportsSortedByInit.forEach(
      report => 
        report.recalc.name && 
        initTable.appendChild(createTableRow(report.init, minInitAvg))
    );
  }, 0);
}

runButton.addEventListener('click', runBenchmark);

// const d = createSubject('d');
// const e = createSubject('e');
// const b = createComputed(() => d());
// const c = createComputed(() => e());
// const a = createComputed(() => b() + c());

// console.log(a());

// console.log(a.__spredState__);


// const a = new Cell(1);
// const b = new Cell(2);
// const c = new Cell(function() {
//   return a.get() + b.get();
// });

// c.on('change', v => console.log(v.data.value));

// a.set(2);
// b.set(2);