const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
let loaded;
async function modules() {
  if (!loaded) loaded = (async () => {
    global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    const store = require('./loadTypeScript.cjs')('store/useMetradoStore.ts');
    const source = fs.readFileSync("components/metrados/calculations.ts", "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const sandbox = { exports: {}, require: () => store };
    vm.runInNewContext(code, sandbox, { codeGeneration: { strings: false, wasm: false } });
    return { store, calc: sandbox.exports };
  })();
  return loaded;
}
test("Q7 longitudinal steel includes hooks, multiplicity and splices exactly once", async () => {
  const { calc } = await modules();
  const input = { description: "CA", bar: 1, elements: 2, quantity: 4, length: 4.4, hookStart: .4, hookEnd: 0, splice: .45 };
  assert.equal(calc.calculateSteel(input).weightKg, 21.5);
  const long = calc.calculateSteel({ ...input, length: 10, hookStart: 0, elements: 1, quantity: 1 });
  assert.equal(long.splices, 1); assert.equal(long.length, 10); assert.equal(long.weightKg, 5.85);
  assert.throws(() => calc.calculateSteel({ ...input, splice: 9 }), /empalme/);
});
test("Q7 slab produces separate concrete, base, perimeter and auditable steel", async () => {
  const { calc } = await modules();
  const input = { description: "Losa", quantity: 2, length: 5, width: 4, height: .2, cover: .04, twoLayers: false, vertical: false, concrete: true, base: true, perimeter: true, steel: true, layers: [{ sx: .2, sy: .2, dx: 1, dy: 1 }, { sx: .2, sy: .2, dx: 1, dy: 1 }] };
  const groups = calc.calculateSlab(input);
  assert.equal(groups.map((v) => v.unit).join(","), "m3,m2,m2,kg");
  assert.equal(calc.groupTotal(groups[0]), 8);
  assert.equal(calc.groupTotal(groups[1]), 40);
  assert.ok(Math.abs(calc.groupTotal(groups[2]) - 7.2) < 1e-10);
  assert.equal(groups[3].steelLines[0].quantity, 26);
  assert.equal(groups[3].steelLines[1].quantity, 21);
  assert.equal(calc.groupTotal(groups[3]), 229.88);
  assert.equal(calc.calculateSlab({ ...input, twoLayers: true })[3].steelLines.length, 4);
  assert.throws(() => calc.calculateSlab({ ...input, cover: 2 }), /recubrimiento/);
});
test("Q7 column includes viga in concrete and excludes it from formwork", async () => {
  const { calc } = await modules();
  const input = { description: "C1", quantity: 2, cover: .04, nodeSpacing: .1, floors: [{ name: "1", height: 3, beam: .4, width: .25, thickness: .25, includeBeam: true }], exterior: 4, exteriorBar: 1, interior: 0, interiorBar: 1, tieBar: 0, ties: 1, crossX: 0, crossY: 0, zones: [{ maxBars: 3, spacing: .05 }, { maxBars: 10, spacing: .1 }, { maxBars: 0, spacing: .2 }], concrete: true, formwork: true, steel: true };
  const groups = calc.calculateColumn(input);
  assert.equal(calc.groupTotal(groups[0]), .425);
  assert.equal(calc.groupTotal(groups[1]), 6);
  const longitudinal = groups[2].steelLines.find((line) => line.description.includes("Exterior"));
  assert.equal(longitudinal.weightKg, 16.67);
  const tie = groups[2].steelLines.find((line) => line.description.includes("Estribo"));
  assert.equal(tie.length, 1); assert.equal(tie.quantity, 28); assert.equal(tie.weightKg, 14);
  const node = groups[2].steelLines.find((line) => line.description.includes("nudo"));
  assert.equal(node.quantity, 4); assert.equal(node.weightKg, 2);
});
test("wood conversion works with mixed units and pie tablar multiplicity", async () => {
  const { calc } = await modules();
  const [group] = calc.calculateWood({ description: "Tabla", elements: 3, quantity: 2, length: 1, width: 12, thickness: 1, lengthUnit: "ft", widthUnit: "in", thicknessUnit: "in" });
  assert.equal(calc.groupTotal(group), 6);
});
test("Q7 automatic first stirrup zone uses Integer conversion, ignores following zones", async () => {
  const { store } = await modules();
  assert.equal(store.roundVba(10.5), 10); assert.equal(store.roundVba(11.5), 12);
  const result = store.calculateStirrupCount({ length: 2.1, symmetric: true, zones: [{ maxBars: 0, spacing: .1 }, { maxBars: 2, spacing: 0 }] });
  assert.equal(result.count, 20); assert.equal(result.zones.join(","), "10,0");
});
test("sending a calculator preserves partida hierarchy and only aggregates matching units", async () => {
  const { store, calc } = await modules(), state = store.useMetradoStore;
  const before = state.getState();
  try {
    state.setState({ items: [], selectedItemId: null });
    const chapter = state.getState().addItem("chapter", null, "ESTRUCTURAS");
    const partida = state.getState().addItem("item", chapter, "Concreto");
    const line = calc.measurement("C1", "volume", 1, 3, .25, .25);
    state.getState().commitCalculation([{ description: "CONCRETO", unit: "m3", measurements: [line], steelLines: [] }, { description: "ACERO", unit: "kg", measurements: [], steelLines: [] }], partida);
    const items = state.getState().items;
    assert.equal(items.some((item) => item.parentId === partida), false);
    assert.equal(items.find((item) => item.id === partida).measurements.length, 1);
    assert.equal(items.find((item) => item.description === "ACERO").parentId, chapter);
    const current = items.find((item) => item.id === partida);
    assert.equal(store.calculateItemTotal({ ...current, measurements: [...current.measurements, { ...line, id: "other", unit: "m2", kind: "area" }] }), .1875);
    state.getState().renumberItems(1, "EST-", "-A");
    const newItem = state.getState().addItem("item", chapter, "Nuevo");
    assert.equal(state.getState().items.find((item) => item.id === newItem).code, "EST-01.03-A");
  } finally { state.setState(before, true); }
});
