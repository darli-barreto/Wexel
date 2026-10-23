const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict"), test = require("node:test"), ts = require("typescript");
const cache = new Map(), storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
function load(file) {
  file = path.resolve(file); if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8')); if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports: mod.exports, module: mod, structuredClone, localStorage: storage, crypto: require("node:crypto").webcrypto, require: (id) => id.startsWith("@/") ? load(id.slice(2) + ".ts") : id.startsWith(".") ? load(path.resolve(path.dirname(file), id) + (id.endsWith('.json') ? '' : '.ts')) : require(id) });
  return mod.exports;
}
const { useWexelStore: excel } = load("store/useWexelStore.ts");
const { useMetradoStore: model } = load("store/useMetradoStore.ts");
const { startMetradoWorkbookSync, refreshMetradoAppearance } = load("components/metrados/syncWorkbook.ts");
const { beginEdit, changeDraft, commitEdit } = load("components/utils/excelEditing.ts");
const { useExcelEditingStore: editing } = load("store/useExcelEditingStore.ts");
const { METRADO_SHEETS } = load("components/metrados/workbook.ts");
const { steelSourceAddress } = load("components/metrados/steelWorkbook.ts");
const { applyNormaTemplate } = load("components/metrados/normaTemplate.ts");
const { rowHeight, layoutRows, visibleRows } = load("components/utils/virtualRows.ts");
const { toggleQuispeExample, quispeExampleControls, quispeSteelControls } = load("components/metrados/exampleTemplate.ts");
const initialExcel = excel.getState(), initialModel = model.getState();
function reset() { editing.setState({ draft: null }); excel.setState(initialExcel, true); model.setState(initialModel, true); }
function edit(address, value) { beginEdit(address); changeDraft(value); commitEdit(); }
const cell = (rawValue) => ({ rawValue, displayValue: rawValue, dependencies: [] });
function sheet(view = "metrado") { return excel.getState().workbooks.Metrados.sheets.find((sheet) => sheet.id === METRADO_SHEETS[view]); }
function example() {
  const id = model.getState().addItem("item", null, "Excavación");
  model.getState().addMeasurement(id, { description: "Zanja", unit: "m3", kind: "volume", similarElements: 1, length: 2, width: 3, height: 4, repetitions: 1, sign: 1 });
  return id;
}

test('normative detail rows stay blank until dimensions are complete, then calculate and follow unit changes', () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); applyNormaTemplate(['OE.1']);
    const item = model.getState().items.find(i => i.norma?.id === 'OE.1.1.1.1');
    const line = item.measurements[0];
    const row = sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const itemRow = sheet().template.rows[JSON.stringify(['item',item.id,'',''])];
    assert.equal(sheet().cells['E'+row].rawValue,'m2');
    assert.equal(sheet().cells['G'+row].rawValue,''); assert.equal(sheet().cells['L'+row].rawValue,'');
    edit('D'+row,'Oficina principal'); edit('G'+row,'=2*3');
    assert.equal(sheet().cells['P'+itemRow].rawValue,'');
    edit('H'+row,'4');
    assert.equal(Number(sheet().cells['L'+row].displayValue),24);
    assert.equal(Number(sheet().cells['P'+itemRow].displayValue),24);
    assert.equal(model.getState().items.find(i=>i.id===item.id).measurements[0].pending,false);
    edit('H'+row,''); assert.equal(sheet().cells['P'+itemRow].rawValue,'');
    edit('L'+row,'=10+2'); assert.equal(Number(sheet().cells['P'+itemRow].displayValue),12);
    const fence = model.getState().items.find(i=>i.norma?.id==='OE.1.1.1.7');
    model.getState().updateItem(fence.id,{unit:'m'});
    assert.equal(model.getState().items.find(i=>i.id===fence.id).measurements[0].unit,'m');
    assert.equal(model.getState().items.find(i=>i.id===fence.id).measurements[0].kind,'length');
  } finally { stop(); }
});

test('old normative projects gain details once, preserving existing measurements and deleted rows on reload', () => {
  reset(); const { createNormaItems } = load('components/metrados/normaCatalog.ts');
  const items = createNormaItems(['OE.1']).map(item=>({...item,detailTemplateVersion:undefined,measurements:[]}));
  model.setState({items}); let stop = startMetradoWorkbookSync();
  const item = model.getState().items.find(i=>i.kind==='item');
  assert.equal(item.measurements.length,1);
  model.getState().removeMeasurement(item.id,item.measurements[0].id);
  stop(); stop = startMetradoWorkbookSync();
  try { assert.equal(model.getState().items.find(i=>i.id===item.id).measurements.length,0); }
  finally { stop(); }
});

test('editing one detail reuses unrelated cell objects while recalculating its totals', () => {
  reset(); example(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');
    const before = sheet(); edit('G3','5');
    assert.equal(sheet().cells.D1,before.cells.D1);
    assert.equal(sheet().cells.D2,before.cells.D2);
    assert.equal(Number(sheet().cells.P2.displayValue),60);
  } finally { stop(); }
});

test('normative template starts from the saved project, not the Q7 preview, and leaves new totals blank',()=>{
  reset();const id=example(),stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');edit('Z30','=M3*2');
    toggleQuispeExample();const count=applyNormaTemplate(['OE.2']);
    assert.ok(count>180);assert.equal(model.getState().demoBackup,undefined);
    assert.equal(model.getState().items.filter(i=>!i.norma).length,1);
    assert.equal(model.getState().items.find(i=>i.id===id).measurements.length,1);
    assert.equal(model.getState().steelSheetItems,undefined);
    const concrete=model.getState().items.find(i=>i.norma?.id==='OE.2.3.7.1');
    const row=sheet().template.rows[JSON.stringify(['item',concrete.id,'',''])];
    const summaryRow=sheet('resumen').template.rows[JSON.stringify(['item',concrete.id,'',''])];
    assert.equal(sheet().cells['P'+row].rawValue,'');
    assert.equal(sheet('resumen').cells['F'+summaryRow].rawValue,'');
    assert.equal(sheet().cells.C1.rawValue,'Ítem');
    const before=sheet();assert.equal(applyNormaTemplate(['OE.2']),0);assert.equal(sheet(),before);
    model.getState().addMeasurement(concrete.id,{description:'C1',unit:'m3',kind:'volume',similarElements:1,length:2,width:3,height:4,repetitions:1,sign:1});
    assert.equal(Number(sheet().cells['P'+row].displayValue),24);
    assert.equal(Number(sheet('resumen').cells['F'+summaryRow].displayValue),24);
    assert.throws(()=>model.getState().renumberItems(1,'',''),/conserva sus códigos/);
    const root=model.getState().items.find(i=>i.norma?.id==='OE.2');model.getState().removeItem(root.id);
    assert.equal(model.getState().items.length,1);assert.equal(model.getState().items[0].id,id);
  }finally{stop();}
});

test("palette refresh updates saved row backgrounds without changing data or manual dimensions", () => {
  reset();
  const chapterId = model.getState().addItem("chapter", null, "Capítulo");
  example();
  const stop = startMetradoWorkbookSync();
  try {
    const { COLORS } = load("config/colors.ts");
    const before = sheet(), items = model.getState().items;
    const chapterRow = before.template.rows[JSON.stringify(["item", chapterId, "", ""])];
    assert.ok(chapterRow);
    excel.getState().replaceWorkbook("Metrados", {
      ...excel.getState().workbooks.Metrados,
      sheets: excel.getState().workbooks.Metrados.sheets.map((s) => s.id !== before.id ? s : ({
        ...s, colWidths: { ...s.colWidths, D: 421 }, rowHeights: { ...s.rowHeights, 2: 39 },
        template: { ...s.template, paletteSignature: "previous-palette" },
        cells: Object.fromEntries(Object.entries(s.cells).map(([a, c]) => [a, { ...c, backgroundColor: "#123456" }])),
      })),
    });
    refreshMetradoAppearance();
    assert.equal(sheet().cells.D1.backgroundColor, COLORS.metrado.heading);
    assert.equal(sheet().cells[`D${chapterRow}`].backgroundColor, COLORS.metrado.chapter);
    assert.ok(Object.values(sheet().cells).some((c) => c.backgroundColor === COLORS.metrado.item));
    assert.equal(sheet().colWidths.D, 421);
    assert.equal(sheet().rowHeights[2], 39);
    assert.equal(model.getState().items, items);
    for (const [address, c] of Object.entries(before.cells)) assert.equal(sheet().cells[address].rawValue, c.rawValue);
    const unchanged = sheet();
    refreshMetradoAppearance();
    assert.equal(sheet(), unchanged);
  } finally { stop(); }
});
test("blank, Metrados and other tabs keep independent cells and sizes", () => {
  reset();
  const blankId = excel.getState().activeSheetId;
  excel.getState().updateSheet(blankId, (s) => ({ ...s, cells: { A1: cell("Privado") } }));
  excel.getState().setColumnWidth(blankId, "D", 240);
  const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados");
    assert.equal(excel.getState().sheets[0].id, METRADO_SHEETS.metrado);
    assert.equal(excel.getState().sheets[0].colWidths.D, 380);
    excel.getState().setColumnWidth(METRADO_SHEETS.metrado, "D", 380);
    excel.getState().setActiveSection("Costos");
    assert.equal(Object.keys(excel.getState().sheets[0].cells).length, 0);
    excel.getState().setActiveSection("Home");
    assert.equal(excel.getState().sheets[0].cells.A1.rawValue, "Privado");
    assert.equal(excel.getState().sheets[0].colWidths.D, 240);
    excel.getState().setActiveSection("Metrados");
    assert.equal(excel.getState().sheets[0].colWidths.D, 380);
  } finally { stop(); }
});
test("Metrado has no project header, uses original editable cells and formula totals", () => {
  reset(); model.getState().updateHeader({ project: "No debe estar en Metrado" });
  const id = example(), stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados");
    assert.equal(Object.values(sheet().cells).some((c) => c.rawValue.includes("No debe estar")), false);
    assert.equal(sheet().cells.D2.rawValue, "EXCAVACIÓN");
    assert.equal(sheet().cells.M3.displayValue, "24");
    edit("G3", "=H3+1");
    assert.equal(sheet().cells.M3.displayValue, "48");
    edit("H3", "5");
    assert.equal(sheet().cells.G3.rawValue, "=H3+1");
    assert.equal(sheet().cells.M3.displayValue, "120");
    assert.equal(sheet().cells.P2.displayValue, "120");
    assert.equal(sheet("resumen").cells.F2.displayValue, "120");
    assert.equal(model.getState().items.find((v) => v.id === id).measurements[0].length, 6);
  } finally { stop(); }
});
test("template updates preserve custom cells, formulas, column widths and row heights", () => {
  reset(); const id = example(), stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados");
    edit("G3", "=H3+1");
    edit("Z30", "=M3*2");
    excel.getState().setColumnWidth(METRADO_SHEETS.metrado, "D", 345);
    excel.getState().setRowHeight(METRADO_SHEETS.metrado, "3", 52);
    model.getState().addMeasurement(id, { description: "Otra zanja", unit: "m3", kind: "volume", similarElements: 1, length: 1, width: 1, height: 1, repetitions: 1, sign: 1 });
    assert.equal(sheet().colWidths.D, 345);
    assert.equal(sheet().rowHeights["3"], 52);
    assert.equal(sheet().cells.G3.rawValue, "=H3+1");
    assert.equal(sheet().cells.Z31.rawValue, "=M3*2");
    assert.equal(sheet().cells.Z31.displayValue, "96");
    assert.equal(sheet().cells.P2.displayValue, "49");
  } finally { stop(); }
});
test("row relocation moves native references and their editing selection together", () => {
  reset(); example(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados"); edit("G3", "=H3+1");
    excel.getState().updateSheet(METRADO_SHEETS.metrado, (s) => ({ ...s, selectedCell: { row: 2, col: 6 }, currentCell: "G3" }));
    model.setState((s) => ({ items: [{ id: "first", parentId: null, kind: "chapter", code: "01", description: "Primero", unit: "", order: -1, measurements: [], steelLines: [] }, ...s.items] }));
    assert.equal(sheet().cells.G4.rawValue, "=H4+1");
    assert.equal(sheet().cells.M4.displayValue, "48");
    assert.equal(sheet().currentCell, "G4");
  } finally { stop(); }
});
test("committing a pending draft after switching workbooks updates its original sheet", () => {
  reset(); const blankId = excel.getState().activeSheetId;
  beginEdit("A1"); changeDraft("123");
  excel.getState().setActiveSection("Costos"); commitEdit();
  assert.equal(excel.getState().workbooks.blank.sheets.find((s) => s.id === blankId).cells.A1.rawValue, "123");
  assert.equal(excel.getState().sheets[0].cells.A1, undefined);
});
test("templates beyond row 99 use the same formula engine and retain their totals", () => {
  reset(); const id = example(), first = model.getState().items[0].measurements[0];
  model.setState((s) => ({ items: s.items.map((v) => ({ ...v, measurements: Array.from({ length: 120 }, (_, i) => ({ ...first, id: "line-" + i })) })) }));
  const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados");
    assert.equal(sheet().cells.P2.displayValue, "2880");
    edit("G122", "3");
    assert.equal(sheet().cells.M122.displayValue, "36");
    assert.equal(sheet().cells.P2.displayValue, "2892");
    assert.equal(model.getState().items.find((v) => v.id === id).measurements.at(-1).length, 3);
  } finally { stop(); }
});
test("custom result formulas remain editable and update the domain and summary", () => {
  reset(); const id = example(), stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados");
    edit("M3", "=SUM(G3:I3)");
    assert.equal(sheet().cells.M3.displayValue, "9");
    assert.equal(sheet("resumen").cells.F2.displayValue, "9");
    model.getState().addMeasurement(id, { description: "Más", unit: "m3", kind: "volume", similarElements: 1, length: 1, width: 1, height: 1, repetitions: 1, sign: 1 });
    assert.equal(sheet().cells.M3.rawValue, "=SUM(G3:I3)");
    edit("H3", "6");
    assert.equal(sheet().cells.M3.displayValue, "12");
    assert.equal(sheet().cells.P2.displayValue, "13");
  } finally { stop(); }
});
test("edits and custom formulas on Acero preserve their source and update Metrado", () => {
  reset(); const id = model.getState().addItem("item", null, "Acero");
  model.getState().updateItem(id, { unit: "kg" });
  model.getState().addSteelLine(id, { description: "Barras", bar: "Ø 3/8″", diameterMm: 9.525, kgPerMeter: .56, similarElements: 2, quantity: 4, length: 4.4, hookStart: .4, hookEnd: 0, spliceLength: .45, splices: 0, weightKg: 21.5 });
  const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados");
    excel.getState().setActiveSheet(METRADO_SHEETS.acero);
    edit("H5", ".8");
    assert.equal(sheet().cells.H3.rawValue, "0.8");
    edit("V5", "=G5*100");
    assert.equal(sheet("acero").cells.V5.rawValue, "=G5*100");
    assert.ok(Math.abs(Number(sheet().cells.N3.displayValue) - 440) < 1e-9);
    assert.equal(model.getState().items[0].steelLines[0].weightView, "acero");
  } finally { stop(); }
});

test("Q7 demo reconciles every original partida and keeps the independent steel reference separate", () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection("Metrados"); toggleQuispeExample();
    assert.equal(model.getState().items.length, 47);
    for (const control of quispeExampleControls) {
      const item = model.getState().items.find((item) => item.code === control.code);
      const row = sheet().template.rows[JSON.stringify(["item", item.id, "", ""])];
      assert.ok(Math.abs(Number(sheet().cells['P' + row].displayValue) - control.total) < 1e-8, `${control.code} does not match ${control.sourceCell}: ${sheet().cells['P' + row].displayValue} vs ${control.total}`);
    }
    const reference = sheet('acero');
    assert.ok(Math.abs(Number(reference.cells.V32.displayValue) - 300.716) < 1e-8);
    for (const control of quispeSteelControls) assert.ok(Math.abs(Number(reference.cells[steelSourceAddress(control.cell)]?.displayValue ?? 0)-control.value)<1e-8,`Acero!${control.cell}: ${reference.cells[steelSourceAddress(control.cell)]?.displayValue} vs ${control.value}`);
    const errors = excel.getState().sheets.flatMap((s) => Object.entries(s.cells).filter(([,c]) => c.displayValue.startsWith('#')).map(([a]) => s.name + '!' + a));
    assert.equal(errors.length, 0, errors.join(', '));
    // Native editing must still update the live calculation and consolidated summary.
    const first = model.getState().items.find((item) => item.code === '02.01.01');
    const detailRow = sheet().template.rows[JSON.stringify(['measurement',first.id,first.measurements[0].id,''])];
    edit('G' + detailRow, '30');
    const itemRow = sheet().template.rows[JSON.stringify(['item',first.id,'',''])];
    assert.equal(Number(sheet().cells['P' + itemRow].displayValue), 297);
    assert.equal(model.getState().items.find((item) => item.id === first.id).measurements[0].length, 30);
  } finally { stop(); }
});

test("leaving the Q7 demo restores original formulas, notes, dimensions and estimate without changing Home", () => {
  reset(); const id = example(), stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');
    edit('Z30', '=M3*2'); excel.getState().setColumnWidth(METRADO_SHEETS.metrado,'D',420);
    const before = JSON.stringify(excel.getState().sheets);
    toggleQuispeExample();
    assert.ok(model.getState().demoBackup);
    edit('G5','123');
    toggleQuispeExample();
    assert.equal(model.getState().items[0].id,id);
    assert.equal(model.getState().demoBackup,undefined);
    assert.equal(JSON.stringify(excel.getState().sheets),before);
    excel.getState().setActiveSection('Home'); assert.equal(Object.keys(excel.getState().sheets[0].cells).length,0);
  } finally { stop(); }
});

test("returning from Q7 repairs an old empty placeholder backup and selects the real Metrado", () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); toggleQuispeExample();
    const backup=model.getState().demoBackup;
    const placeholder={...initialExcel.sheets[0],id:'Metrados-sheet-1',name:'Sheet 1',cells:{Z30:cell('Nota anterior')},colWidths:{D:350}};
    model.setState({demoBackup:{...backup,workbook:{sheets:[placeholder],activeSheetId:placeholder.id}}});
    toggleQuispeExample();
    assert.equal(model.getState().demoBackup,undefined);
    assert.equal(excel.getState().activeSheetId,METRADO_SHEETS.metrado);
    for(const view of ['metrado','acero','resumen']) {
      assert.match(sheet(view).cells.C1.rawValue,/^[IÍ]tem$|^ITEM$/);
      assert.ok(sheet(view).cells.D1.rawValue);
    }
    assert.equal(excel.getState().sheets.find(s=>s.id===placeholder.id).cells.Z30.rawValue,'Nota anterior');
    assert.equal(model.getState().items.length,0);
  } finally {stop();}
});

test("returning from Q7 repairs missing table headings without discarding custom cell edits", () => {
  reset(); example(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');
    edit('G3','=H3+1'); edit('Z30','=M3*2');
    excel.getState().setColumnWidth(METRADO_SHEETS.metrado,'D',420);
    excel.getState().setRowHeight(METRADO_SHEETS.metrado,'3',46);
    toggleQuispeExample();
    const backup=model.getState().demoBackup;
    model.setState({demoBackup:{...backup,workbook:{...backup.workbook,sheets:backup.workbook.sheets.map(s=>({...s,cells:{...s.cells,C1:cell(''),D1:cell('')}}))}}});
    toggleQuispeExample();
    assert.equal(sheet().cells.C1.rawValue,'Ítem');
    assert.equal(sheet().cells.D1.rawValue,'Descripción');
    assert.equal(sheet().cells.G3.rawValue,'=H3+1');
    assert.equal(sheet().cells.Z30.rawValue,'=M3*2');
    assert.equal(sheet().colWidths.D,420);
    assert.equal(sheet().rowHeights['3'],46);
    assert.equal(model.getState().items.length,1);
  } finally {stop();}
});

test("formatting keeps descriptions left aligned, gray grid and user formulas and sizes", () => {
  reset(); example(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); edit('G3','=H3+1');
    excel.getState().setColumnWidth(METRADO_SHEETS.metrado,'D',460);
    model.setState({tableStyle:'blue',showFill:false,showFrame:false});
    assert.equal(sheet().cells.D2.align,'left');
    assert.equal(sheet().cells.D2.backgroundColor,'#ffffff');
    assert.equal(sheet().cells.D2.borderStyle,'none');
    assert.equal(sheet().cells.G3.rawValue,'=H3+1');
    assert.equal(sheet().colWidths.D,460);
    assert.equal(Number(sheet().cells.P2.displayValue),48);
  } finally { stop(); }
});

test("selection-only navigation never recalculates native cells or advances the durable revision", () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');toggleQuispeExample();
    const before=sheet(),revision=excel.getState().contentRevision;
    for(let r=4;r<24;r++){
      commitEdit();excel.getState().updateSheet(before.id,s=>({...s,currentCell:'D'+r,selectedCell:{row:r-1,col:3},formulaInput:s.cells['D'+r]?.rawValue??''}));beginEdit('D'+r);
    }
    commitEdit();
    assert.equal(sheet().cells,before.cells);
    assert.equal(excel.getState().contentRevision,revision);
  } finally {stop();}
});

test("Acero reproduces Q7 by diameter and recalculates without mixing the independent Metrado", () => {
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');toggleQuispeExample();excel.getState().setActiveSheet(METRADO_SHEETS.acero);
    const main=JSON.stringify(model.getState().items);
    edit('G6','5');
    assert.ok(Math.abs(Number(sheet('acero').cells.L6.displayValue)-43.2)<1e-9);
    assert.ok(Math.abs(Number(sheet('acero').cells.V6.displayValue)-24.192)<1e-9);
    assert.ok(Math.abs(Number(sheet('acero').cells.W4.displayValue)-165.648)<1e-9);
    assert.ok(Math.abs(Number(sheet('acero').cells.V32.displayValue)-303.404)<1e-9);
    assert.equal(JSON.stringify(model.getState().items),main);
    edit('G6','=G8+1');edit('H6','.8');
    assert.equal(sheet('acero').cells.G6.rawValue,'=G8+1');
    assert.ok(Math.abs(Number(sheet('acero').cells.L6.displayValue)-52)<1e-9);
    const group=model.getState().steelSheetItems[0];
    model.getState().commitCalculation([{description:group.description,unit:'kg',measurements:[],steelLines:[{description:'Barra adicional',bar:'Ø 3/8″',diameterMm:9.525,kgPerMeter:.56,similarElements:1,quantity:1,length:1,hookStart:0,hookEnd:0,spliceLength:0,splices:0,weightKg:.56}]}],group.id);
    assert.equal(model.getState().steelSheetItems[0].steelLines.length,9);
    assert.equal(JSON.stringify(model.getState().items),main);
    assert.equal(model.getState().view,'acero');
  }finally{stop();}
});

test("compact dynamic rows expand on long text, react to column resizing and keep manual heights", () => {
  reset();example();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');
    assert.equal(rowHeight(sheet(),'2'),21);
    assert.equal(rowHeight(sheet(),'3'),21);
    edit('D3','Descripción extensa de un elemento estructural que necesita más de una línea para mostrarse completa.');
    const wide=rowHeight(sheet(),'3');assert.ok(wide>21);
    excel.getState().setColumnWidth(sheet().id,'D',180);assert.ok(rowHeight(sheet(),'3')>wide);
    excel.getState().setRowHeight(sheet().id,'3',80);assert.equal(rowHeight(sheet(),'3'),80);
  }finally{stop();}
});

test("item titles and codes are uppercase during editing and left aligned in every worksheet", () => {
  reset(); const id = example(), stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');
    beginEdit('D2'); changeDraft('excavación en cimentación');
    assert.equal(editing.getState().draft.value, 'EXCAVACIÓN EN CIMENTACIÓN');
    commitEdit();
    edit('C2', 'a.01');
    assert.equal(model.getState().items[0].description, 'EXCAVACIÓN EN CIMENTACIÓN');
    assert.equal(model.getState().items[0].code, 'A.01');
    edit('D3', 'Detalle en minúsculas');
    assert.equal(sheet().cells.D3.rawValue, 'Detalle en minúsculas');
    model.getState().updateItem(id, { description: 'otra partida' });
    assert.equal(model.getState().items[0].description, 'OTRA PARTIDA');
    for (const view of ['metrado', 'resumen']) {
      assert.equal(sheet(view).cells.C2.align, 'left');
      assert.equal(sheet(view).cells.D2.rawValue, 'OTRA PARTIDA');
    }
    toggleQuispeExample();
    assert.equal(sheet('acero').cells.C4.align, 'left');
    excel.getState().setActiveSheet(METRADO_SHEETS.acero);
    edit('D4', 'acero de columnas');
    assert.equal(sheet('acero').cells.D4.rawValue, 'ACERO DE COLUMNAS');
    const imported = {...model.getState().items[0],description:'título importado',code:'b.01'};
    model.getState().importEstimate([imported], model.getState().header);
    assert.equal(model.getState().items[0].description, 'TÍTULO IMPORTADO');
    assert.equal(model.getState().items[0].code, 'B.01');
  } finally { stop(); }
});

test("all three worksheets start with table headings and contain no project metadata block", () => {
  reset(); model.getState().updateHeader({ project: 'PROYECTO PRIVADO XYZ', owner: 'PROPIETARIO XYZ' });
  const stop = startMetradoWorkbookSync();
  try {
    for (const view of ['metrado', 'acero', 'resumen']) {
      assert.match(sheet(view).cells.C1.rawValue.toUpperCase(), /^[IÍ]TEM$/);
      assert.equal(Object.values(sheet(view).cells).some(c => c.rawValue.includes('XYZ')), false);
    }
    assert.equal(model.getState().header.project, 'PROYECTO PRIVADO XYZ');
  } finally { stop(); }
});

test("switching worksheets reuses geometry and never recalculates cells", () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); toggleQuispeExample();
    const before = Object.fromEntries(['metrado', 'acero', 'resumen'].map(view => [view, sheet(view)]));
    const count = 200, rows = Array.from({length:count}, (_,i) => String(i+1));
    const cached = Object.fromEntries(Object.entries(before).map(([view,s]) => [view, layoutRows(s,rows)]));
    const revision = excel.getState().contentRevision;
    for (let round = 0; round < 10; round++) for (const view of ['acero','resumen','metrado']) {
      excel.getState().setActiveSheet(METRADO_SHEETS[view]);
      assert.equal(sheet(view).cells, before[view].cells);
      assert.equal(layoutRows(sheet(view), [...rows]), cached[view]);
    }
    assert.equal(excel.getState().contentRevision, revision);
    const resized = {...before.metrado, colWidths:{...before.metrado.colWidths,D:170}};
    assert.notEqual(layoutRows(resized,rows),cached.metrado);
  } finally { stop(); }
});

test("removing legacy info blocks relocates custom formulas and dimensions safely", () => {
  reset(); const stop = startMetradoWorkbookSync();
  excel.getState().setActiveSection('Metrados'); toggleQuispeExample(); stop();
  const workbook = excel.getState().workbooks.Metrados;
  const shift = (text, delta) => text.replace(/(\$?[A-Z]+\$?)(\d+)/g, (_,col,row) => col + (Number(row)+delta));
  const oldSheets = workbook.sheets.map(s => {
    if(s.id===METRADO_SHEETS.metrado) return s;
    const delta=s.id===METRADO_SHEETS.acero?13:9;
    const move=a=>shift(a,delta);
    const cells=Object.fromEntries(Object.entries(s.cells).map(([a,c])=>[move(a),{...c,rawValue:c.rawValue.startsWith('=')?shift(c.rawValue,delta):c.rawValue}]));
    const generated=Object.fromEntries(Object.entries(s.template.generated).map(([a,b])=>[move(a),{...b,rawValue:b.rawValue.startsWith('=')?shift(b.rawValue,delta):b.rawValue}]));
    cells.D6=cell('INFORMACIÓN ANTERIOR');generated.D6={key:JSON.stringify(['header','','','project']),rawValue:'INFORMACIÓN ANTERIOR'};
    if(delta===13){cells.G19={...cells.G19,rawValue:'=G21+1'};cells.Z60=cell('=V45*2');}
    return {...s,cells,rowHeights:delta===13?{'19':45}:s.rowHeights,colWidths:{...s.colWidths,D:410},template:{...s.template,generated,formatVersion:9,rows:Object.fromEntries(Object.entries(s.template.rows).map(([id,row])=>[id,row+delta]))}};
  });
  excel.getState().replaceWorkbook('Metrados',{...workbook,sheets:oldSheets});
  const resume = startMetradoWorkbookSync();
  try {
    assert.equal(sheet('acero').cells.C1.rawValue,'ITEM');
    assert.equal(sheet('resumen').cells.D1.rawValue,'Descripción');
    assert.equal(sheet('acero').cells.G6.rawValue,'=G8+1');
    assert.equal(sheet('acero').cells.Z47.rawValue,'=V32*2');
    assert.equal(sheet('acero').rowHeights['6'],45);
    assert.equal(sheet('acero').colWidths.D,410);
    assert.equal(Object.values(sheet('acero').cells).some(c=>c.rawValue==='INFORMACIÓN ANTERIOR'),false);
  } finally {resume();}
});

test("large workbooks render a bounded visible window and preserve original row indexes", () => {
  const rows=Array.from({length:10000},(_,i)=>String(i+1));
  const s={cells:{},colWidths:{},rowHeights:{'5000':56},hiddenRows:['3']};
  const layout=layoutRows(s,rows), window=visibleRows(layout,100000,600);
  assert.ok(window.rows.length<50);
  assert.ok(window.before>0&&window.after>0);
  assert.equal(layout[2].index,3);
  assert.equal(layout.find(r=>r.row==='5000').height,56);
});

test("persisted workbook aliases rehydrate without serializing an extra active copy", () => {
  reset();example();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');edit('Z30','=M3*2');
    const options=excel.persist.getOptions();const saved=options.partialize(excel.getState());
    const restored=options.merge(JSON.parse(JSON.stringify(saved)),initialExcel);
    assert.equal(restored.sheets[0].cells.Z30.rawValue,'=M3*2');
    assert.equal(restored.sheets[0].cells.Z30.displayValue,'48');
    assert.equal(restored.activeSheetId,METRADO_SHEETS.metrado);
    assert.equal(saved.sheets,undefined);
  }finally{stop();}
});
