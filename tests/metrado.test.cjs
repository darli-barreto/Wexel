const test = require('node:test');
const assert = require('node:assert/strict');

let metrado;
const load=require('./loadTypeScript.cjs');
test('loads the metrado calculation module', async () => {
  metrado = load('store/useMetradoStore.ts');
});

test('calculates positive and negative area/volume lines with multiplicities', async () => {
  metrado ??= load('store/useMetradoStore.ts');
  const area = { description: 'Piso', unit: 'm2', kind: 'area', similarElements: 2, length: 5, width: 3, height: 0, repetitions: 2, sign: 1 };
  const discount = { ...area, sign: -1 };
  const volume = { ...area, kind: 'volume', height: 0.25, repetitions: 1 };
  assert.equal(metrado.calculateMeasurement(area), 60);
  assert.equal(metrado.calculateMeasurement(discount), -60);
  assert.equal(metrado.calculateMeasurement(volume), 7.5);
});

test('counts stirrups through sequential zones and applies symmetry rule', async () => {
  metrado ??= load('store/useMetradoStore.ts');
  const zoned = metrado.calculateStirrupCount({ length: 2, symmetric: false, zones: [
    { maxBars: 3, spacing: 0.1 }, { maxBars: 0, spacing: 0.25 },
  ] });
  assert.deepEqual(zoned.zones, [3, 6]);
  assert.equal(zoned.count, 9);
  const symmetric = metrado.calculateStirrupCount({ length: 3, symmetric: true, zones: [
    { maxBars: 0, spacing: 0.1 },
  ] });
  assert.equal(symmetric.count, 30);
});

test('rejects invalid steel spacings before calculating', async () => {
  metrado ??= load('store/useMetradoStore.ts');
  assert.throws(() => metrado.calculateStirrupCount({
    length: 2,
    symmetric: false,
    zones: [{ maxBars: 0, spacing: 0 }],
  }), /espaciamiento/);
});
