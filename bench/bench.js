const Cell = cellx.Cell;
const createSubject = spred.createSubject;
const createComputed = spred.createComputed;

function logReport(libName, report) {
  console.log(`${libName}: ${report.recalculationTime}`);
}

function testCellx(layerCount) {
  const report = {};
  const initTS = performance.now();

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

      s.prop1.on('change', function () {});
      s.prop2.on('change', function () {});
      s.prop3.on('change', function () {});
      s.prop4.on('change', function () {});

      s.prop1.get();
      s.prop2.get();
      s.prop3.get();
      s.prop4.get();

      return s;
    })(layer);
  }

  const initEndTs = performance.now();

  // console.log(`cellx init time: ${initEndTs - initTS}`);

  const end = layer;

  report.beforeChange = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
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

  report.recalculationTime = performance.now() - st;

  return report;
}

function testSpred(layerCount) {
  const report = {};
  const initTS = performance.now();

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

      s.prop1.subscribe(function () {});
      s.prop2.subscribe(function () {});
      s.prop3.subscribe(function () {});
      s.prop4.subscribe(function () {});

      s.prop1();
      s.prop2();
      s.prop3();
      s.prop4();

      return s;
    })(layer);
  }

  const initEndTs = performance.now();

  // console.log(`cellx init time: ${initEndTs - initTS}`);

  const end = layer;

  report.beforeChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  const st = performance.now();

  start.prop1(4);
  start.prop2(3);
  start.prop3(2);
  start.prop4(1);

  report.afterChange = [end.prop1(), end.prop2(), end.prop3(), end.prop4()];

  report.recalculationTime = performance.now() - st;

  return report;
}

let totalTimeCellx = 0;
let totalTimeSpred = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  totalTimeCellx += testCellx(10).recalculationTime;
  totalTimeSpred += testSpred(10).recalculationTime;
}

console.log('Cellx', totalTimeCellx / iterations);
console.log('Spred', totalTimeSpred / iterations);
