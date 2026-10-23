const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: name => name === './wordTypography'
      ? load('components/utils/wordTypography.ts') : name === '../../config/colors' ? load('config/colors.ts') : require(name),
  });
  return exports;
}
const { cellBorderStyle, cellTextStyle } = load('components/utils/cellFormatting.ts');
const cell = borderStyle => ({ rawValue: '10', displayValue: '10', dependencies: [], borderStyle });
test('border transitions use only independent longhand properties', () => {
  for (const mode of ['all', 'bottom', 'none', 'all', undefined]) {
    const style = cellBorderStyle(cell(mode));
    for (const key of Object.keys(style)) {
      assert.match(key, /^border(Top|Right|Bottom|Left)(Width|Style|Color)$/);
    }
    assert.equal(style.borderTopColor, mode === 'all' ? '#d6d6d6' : undefined);
    assert.equal(style.borderBottomColor, mode === 'all' || mode === 'bottom' ? '#d6d6d6' : undefined);
  }
});
test('text and editor styles never receive cell borders', () => {
  for (const mode of ['all', 'bottom', 'none']) {
    assert.equal(Object.keys(cellTextStyle(cell(mode))).some(key => key.startsWith('border')), false);
  }
});
test('removing borders releases every inline edge to the existing grid styles', () => {
  assert.equal(Object.values(cellBorderStyle(cell('none'))).every(value => value === undefined), true);
});
