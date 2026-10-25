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
const inputColor = load('config/colors.ts').COLORS.metrado.input;
const { startMetradoWorkbookSync, refreshMetradoAppearance } = load("components/metrados/syncWorkbook.ts");
const { beginEdit, changeDraft, commitEdit } = load("components/utils/excelEditing.ts");
const { useExcelEditingStore: editing } = load("store/useExcelEditingStore.ts");
const { METRADO_SHEETS } = load("components/metrados/workbook.ts");
const { steelSourceAddress } = load("components/metrados/steelWorkbook.ts");
const { applyNormaTemplate } = load("components/metrados/normaTemplate.ts");
const { rowHeight, layoutRows, visibleRows } = load("components/utils/virtualRows.ts");
const { toggleQuispeExample, quispeExampleControls, quispeSteelControls } = load("components/metrados/exampleTemplate.ts");
const initialExcel = excel.getState(), initialModel = model.getState();

test('sobrecimiento formwork reuses concrete dimensions, updates live and counts only selected end caps',()=>{
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const find=code=>model.getState().items.find(item=>item.norma?.id===code);
    const concrete=find('OE.2.2.6.1'), target=find('OE.2.2.6.2');
    const row=(item,line)=>sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const source=concrete.measurements[0], r=row(concrete,source);
    const sides=target.measurements.find(line=>line.formworkSource.face==='sides');
    const ends=target.measurements.find(line=>line.formworkSource.face==='ends');
    const a=row(target,sides), b=row(target,ends);
    assert.equal(target.measurements.length,4);
    assert.equal(sheet().cells['L'+a].rawValue,'');
    for(const [col,value] of [['F','2'],['G','2.68'],['H','0.23'],['I','0.50']]) edit(col+r,value);
    assert.ok(Math.abs(Number(sheet().cells['L'+a].displayValue)-5.36)<1e-8);
    assert.equal(Number(sheet().cells['L'+b].displayValue),0);
    assert.equal(sheet().cells['H'+(a-1)].rawValue,'Altura (m)');
    edit('J'+b,'2');
    assert.ok(Math.abs(Number(sheet().cells['L'+b].displayValue)-.46)<1e-8);
    edit('G'+r,'3');assert.equal(Number(sheet().cells['L'+a].displayValue),6);
    edit('I'+r,'0.6');assert.ok(Math.abs(Number(sheet().cells['L'+a].displayValue)-7.2)<1e-8);
    edit('H'+r,'0.3');assert.equal(Number(sheet().cells['L'+b].displayValue),.72);
    edit('J'+r,'3');assert.ok(Math.abs(Number(sheet().cells['L'+a].displayValue)-21.6)<1e-8);
    assert.ok(Math.abs(Number(sheet().cells['L'+b].displayValue)-2.16)<1e-8);
    edit('G'+a,'1');edit('G'+r,'4');
    assert.equal(sheet().cells['G'+a].rawValue,'1');
    const changed=find('OE.2.2.6.2').measurements.find(line=>line.id===sides.id);
    assert.ok(changed.formworkSource.manualFields.includes('length'));
    assert.equal(changed.resultRaw,undefined);
    assert.equal(load('components/metrados/normaCatalog.ts').withNormaDetails(model.getState().items),model.getState().items);
  } finally { stop(); }
});

test('surplus example links excavations minus own fill, applies editable factor once and follows updates',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const find=code=>model.getState().items.find(i=>i.norma?.id===code);
    const excavation=find('OE.2.1.2.1'),fill=find('OE.2.1.4.1'),borrow=find('OE.2.1.4.2'),surplus=find('OE.2.1.6');
    const row=(item,line)=>sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const lines=surplus.measurements;
    assert.ok(lines.every(l=>l.surplus));assert.equal(lines[0].swelling.factor,1.25);
    assert.equal(sheet().cells['M'+row(surplus,lines[0])].rawValue,'');
    for(const [item,volume] of [[excavation,'197.83'],[fill,'6.54'],[borrow,'100']]){
      const r=row(item,item.measurements[0]);edit('G'+r,volume);edit('H'+r,'1');edit('I'+r,'1');
    }
    const a=row(surplus,lines[0]),b=row(surplus,lines[1]);
    assert.equal(Number(sheet().cells['G'+a].displayValue),197.83);
    assert.equal(Number(sheet().cells['G'+b].displayValue),6.54);
    assert.equal(sheet().cells['H'+a].rawValue,'1.25');assert.equal(sheet().cells['J'+b].rawValue,'-1');
    assert.equal(sheet().cells['G'+a].input,false);assert.equal(sheet().cells['H'+a].input,true);assert.equal(sheet().cells['I'+a].input,false);
    const sr=sheet('resumen').template.rows[JSON.stringify(['item',surplus.id,'',''])];
    const total=()=>Number(sheet('resumen').cells['H'+sr].displayValue);
    assert.ok(Math.abs(total()-239.1125)<1e-8);
    edit('G'+row(excavation,excavation.measurements[0]),'200');
    assert.ok(Math.abs(total()-(200-6.54)*1.25)<1e-8);
    assert.ok(model.getState().items.find(i=>i.id===surplus.id).measurements.every(l=>!l.quantityOverride&&!l.resultRaw&&!l.surplus.manual));
    edit('H'+a,'0.5');assert.equal(sheet().cells['M'+a].displayValue,'#ERROR!');
    edit('H'+a,'1.25');assert.ok(Math.abs(total()-(200-6.54)*1.25)<1e-8);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.some(p=>p.rows.some(r=>r.cells.some(c=>c.text.includes('Balance de excedentes:')))));
    edit('G'+b,'10');assert.equal(model.getState().items.find(i=>i.id===surplus.id).measurements[1].surplus.manual,true);
    assert.ok(Math.abs(total()-(200-10)*1.25)<1e-8);
  }finally{stop();}
});

test('grade beam fill subtracts VC and EPS, strip footing and buried plinth with distinct headers and net summary',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const item=model.getState().items.find(i=>i.norma?.id==='OE.2.1.4.1');
    const option=load('components/metrados/detailChoices.ts').detailChoices(item).find(o=>o.id==='fill-group:gradeBeam');
    const result=load('components/metrados/selectDetailChoice.ts').chooseDetail(model.getState().items,item.id,item.measurements[0].id,option,'volume');
    model.setState({items:result.items});
    const current=()=>model.getState().items.find(i=>i.id===item.id);
    const lines=current().measurements.filter(l=>l.fillGroup&&l.presentation!=='separator');
    const row=line=>sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const [excavation,vc,cc,sc]=lines;
    for(const [line,dims] of [[excavation,['1.20','1.05','1.45']],[vc,['1.20','0.25','0.50']],[sc,['1.20','0.25','0.05']]]){
      for(const [i,col] of ['G','H','I'].entries())edit(col+row(line),dims[i]);
    }
    edit('G'+row(cc),'0.60');edit('H'+row(cc),'=1.20*0.60');
    assert.equal(sheet().cells['H'+(row(cc)-1)].rawValue,'A cim. (m²)');
    assert.equal(sheet().cells['G'+(row(sc)-1)].rawValue,'Largo (m)');
    assert.equal(sheet().cells['I'+(row(sc)-1)].rawValue,'Alto (m)');
    for(const line of [vc,cc,sc])assert.equal(sheet().cells['J'+row(line)].rawValue,'-1');
    const sr=sheet('resumen').template.rows[JSON.stringify(['item',item.id,'',''])];
    assert.ok(Math.abs(Number(sheet('resumen').cells['H'+sr].displayValue)-1.23)<1e-9);
    assert.ok(Math.abs(Number(sheet().cells['M'+row(vc)].displayValue)+.15)<1e-9);
    assert.ok(Math.abs(Number(sheet().cells['M'+row(sc)].displayValue)+.015)<1e-9);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.some(p=>p.rows.some(r=>r.cells.some(c=>c.text==='Descuento · Viga de cimentación y tecnopor'))));
    assert.ok(report.pages.some(p=>p.rows.some(r=>r.cells.some(c=>c.text==='Descuento · Sobrecimiento enterrado'))));
  }finally{stop();}
});

test('strip footing deduction uses accumulated CAD area times height and updates the summary',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const item=model.getState().items.find(i=>i.norma?.id==='OE.2.1.4.1');
    const option=load('components/metrados/detailChoices.ts').detailChoices(item).find(o=>o.id==='fill-group:footing');
    const result=load('components/metrados/selectDetailChoice.ts').chooseDetail(model.getState().items,item.id,item.measurements[0].id,option,'volume');
    model.setState({items:result.items});
    const current=()=>model.getState().items.find(i=>i.id===item.id);
    const line=current().measurements.find(l=>l.description==='Descuento · Cimiento corrido');
    const row=sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    assert.equal(sheet().cells['G'+(row-1)].rawValue,'Altura (m)');
    assert.equal(sheet().cells['H'+(row-1)].rawValue,'A cim. (m²)');
    assert.equal(sheet().cells['I'+(row-1)].rawValue,'');
    assert.equal(rowHeight(sheet(),String(row-1)),21);
    edit('G'+row,'0.60');
    assert.equal(sheet().cells['M'+row].rawValue,'');
    assert.equal(sheet().cells['I'+row].input,false);
    edit('H'+row,'=0.40+0.46');
    assert.ok(Math.abs(Number(sheet().cells['M'+row].displayValue)+.516)<1e-9);
    assert.equal(current().measurements.find(l=>l.id===line.id).pending,false);
    const sr=sheet('resumen').template.rows[JSON.stringify(['item',item.id,'',''])];
    assert.ok(Math.abs(Number(sheet('resumen').cells['H'+sr].displayValue)+.516)<1e-9);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.some(p=>p.rows.some(r=>r.cells.some(c=>c.text.includes('Cimiento corrido: área real acumulada en planta')))));
  }finally{stop();}
});
test('cut section inputs calculate natural volume with explicit m2 labels, propagate to summary and delete as one detail',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const cut=model.getState().items.find(item=>item.norma?.id==='OE.2.1.3'),line=cut.measurements[0];
    const row=()=>sheet().template.rows[JSON.stringify(['measurement',cut.id,line.id,''])];
    assert.equal(sheet().cells['H'+(row()-1)].rawValue,'Ai (m²)');
    assert.equal(sheet().cells['M'+row()].rawValue,'');
    edit('G'+row(),'5');edit('H'+row(),'8');assert.equal(sheet().cells['M'+row()].rawValue,'');
    edit('I'+row(),'13.972');
    const format=load('components/utils/cellFormatting.ts').formatCellValue;
    assert.equal(format(sheet().cells['M'+row()]),'54.93');
    assert.equal(sheet().cells['K'+(row()-1)].rawValue,'Am (m²)');
    assert.equal(sheet().cells['K'+row()].rawValue,`=(H${row()}+I${row()})/2`);
    assert.equal(Number(sheet().cells['K'+row()].displayValue),10.986);
    assert.equal(sheet().cells['M'+row()].rawValue,`=F${row()}*G${row()}*K${row()}*J${row()}`);
    const itemRow=sheet().template.rows[JSON.stringify(['item',cut.id,'',''])];
    assert.equal(format(sheet().cells['P'+itemRow]),'54.93');
    const sr=sheet('resumen').template.rows[JSON.stringify(['item',cut.id,'',''])];assert.equal(format(sheet('resumen').cells['H'+sr]),'54.93');
    const current=model.getState().items.find(item=>item.id===cut.id).measurements[0];
    assert.equal(current.quantityOverride,undefined);assert.equal(current.resultRaw,undefined);assert.equal(current.crossSections.finalArea,13.972);
    edit('I'+row(),'-1');assert.equal(sheet().cells['M'+row()].displayValue,'#ERROR!');
    edit('I'+row(),'13.972');assert.equal(format(sheet().cells['M'+row()]),'54.93');
    const changed=load('components/metrados/crossSections.ts').setCrossSectionMethod(current,'meanArea');
    model.getState().updateMeasurement(cut.id,line.id,{crossSections:changed.crossSections,pending:true});
    edit('H'+row(),'10.986');assert.equal(format(sheet().cells['M'+row()]),'54.93');
    assert.equal(sheet().cells['H'+(row()-1)].rawValue,'Am (m²)');
    assert.equal(sheet().cells['G'+(row()-1)].rawValue,'L (m)');
    assert.equal(rowHeight(sheet(),String(row()-1)),21);
    for(const col of 'DGHI')assert.equal(sheet().cells[col+(row()-1)].wrapText,false,col);
    assert.equal(sheet().cells['I'+row()].input,false);assert.equal(sheet().cells['I'+row()].rawValue,'');
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.some(page=>page.rows.some(r=>r.cells.some(c=>c.text.includes('Área media: 10.986 m²')))));
    const deletionRow=row();
    excel.getState().updateSheet(sheet().id,s=>({...s,currentCell:'D'+deletionRow,selectedCell:{row:deletionRow-1,col:3},selectionEnd:undefined}));
    load('components/metrados/syncWorkbook.ts').deleteMetradoRow();
    assert.equal(model.getState().items.find(item=>item.id===cut.id).measurements.length,1);
    assert.equal(sheet().template.rows[JSON.stringify(['sectionHeader',cut.id,line.id,''])],undefined);
  }finally{stop();}
});

test('fill choices calculate compacted sections and net geometric deductions in the worksheet and summary',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const item=model.getState().items.find(item=>item.norma?.id==='OE.2.1.4.1');
    const first=item.measurements[0],second=item.measurements[1];
    const row=line=>sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const choose=(line,id)=>{
      const state=model.getState(),source=state.items.find(i=>i.id===item.id);
      const option=load('components/metrados/detailChoices.ts').detailChoices(source).find(o=>o.id===id);
      model.setState({items:load('components/metrados/selectDetailChoice.ts').chooseDetail(state.items,item.id,line.id,option,'volume').items});
    };
    choose(first,'fill-section:endAreas');
    edit('G'+row(first),'10');edit('H'+row(first),'6');edit('I'+row(first),'10');
    assert.equal(Number(sheet().cells['M'+row(first)].displayValue),80);
    const sr=sheet('resumen').template.rows[JSON.stringify(['item',item.id,'',''])];
    assert.equal(Number(sheet('resumen').cells['H'+sr].displayValue),80);
    choose(first,'fill-section:geometry');
    edit('G'+row(first),'10');edit('H'+row(first),'1');edit('I'+row(first),'1');
    choose(second,'fill-section:deduction');
    edit('G'+row(second),'10');edit('H'+row(second),'0.3');edit('I'+row(second),'0.5');edit('J'+row(second),'-1');
    assert.equal(Number(sheet().cells['M'+row(second)].displayValue),-1.5);
    assert.equal(Number(sheet('resumen').cells['H'+sr].displayValue),8.5);
    assert.equal(sheet().template.rows[JSON.stringify(['sectionHeader',item.id,first.id,''])],undefined);
  }finally{stop();}
});

test('fill groups link element quantities, subtract occupied volumes and keep net totals through editing and reload',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.2']);
    const item=model.getState().items.find(i=>i.norma?.id==='OE.2.1.4.1');
    const option=load('components/metrados/detailChoices.ts').detailChoices(item).find(o=>o.id==='fill-group:footing');
    const result=load('components/metrados/selectDetailChoice.ts').chooseDetail(model.getState().items,item.id,item.measurements[0].id,option,'volume');
    model.setState({items:result.items});
    const get=()=>model.getState().items.find(i=>i.id===item.id),base=get().measurements.find(l=>l.id===result.lineId);
    const deductions=get().measurements.filter(l=>l.fillGroup?.role==='deduction');
    const row=l=>sheet().template.rows[JSON.stringify(['measurement',item.id,l.id,''])];
    edit('F'+row(base),'2');edit('G'+row(base),'2');edit('H'+row(base),'2');edit('I'+row(base),'1.45');
    assert.equal(Number(sheet().cells['M'+row(base)].displayValue),11.6);
    for(const deduction of deductions){assert.equal(sheet().cells['F'+row(deduction)].rawValue,'=F'+row(base));assert.equal(sheet().cells['J'+row(deduction)].rawValue,'-1');assert.equal(sheet().cells['F'+row(deduction)].input,false);}
    assert.ok(load('components/metrados/normaCatalog.ts').reviewNormaItems([get()]).some(issue=>issue.message.includes('total actual es parcial')));
    for(const [i,dims] of [[0,['2','2','0.1']],[1,['2','2','0.6']]]){
      for(const [j,col] of ['G','H','I'].entries())edit(col+row(deductions[i]),dims[j]);
    }
    edit('G'+row(deductions[3]),'1');edit('H'+row(deductions[3]),'=0.43*0.6');
    const column=deductions[2],cr=row(column);
    assert.equal(sheet().cells['G'+(cr-1)].rawValue,'h ent. (m)');
    assert.equal(sheet().cells['H'+(cr-1)].rawValue,'A col. (m²)');
    assert.equal(rowHeight(sheet(),String(cr-1)),21);
    assert.equal(sheet().cells['I'+cr].input,false);assert.equal(sheet().cells['I'+cr].rawValue,'');
    edit('G'+cr,'1');edit('H'+cr,'=0.24*0.9');
    assert.ok(Math.abs(Number(sheet().cells['M'+cr].displayValue)+.432)<1e-9);
    assert.equal(get().measurements.find(l=>l.id===column.id).quantityOverride,undefined);
    const expected=2*(5.8-.4-2.4-.216-.258),sr=sheet('resumen').template.rows[JSON.stringify(['item',item.id,'',''])];
    assert.ok(Math.abs(Number(sheet('resumen').cells['H'+sr].displayValue)-expected)<1e-9);
    assert.ok(!load('components/metrados/normaCatalog.ts').reviewNormaItems([get()]).some(issue=>issue.message.includes('total actual es parcial')));
    edit('F'+row(base),'3');assert.equal(Number(sheet().cells['F'+row(deductions[0])].displayValue),3);
    assert.ok(Math.abs(Number(sheet('resumen').cells['H'+sr].displayValue)-3*(5.8-.4-2.4-.216-.258))<1e-9);
    edit('F'+row(deductions[0]),'2');assert.equal(get().measurements.find(l=>l.id===deductions[0].id).quantitySourceId,undefined);
    edit('F'+row(base),'4');assert.equal(Number(sheet().cells['F'+row(deductions[0])].displayValue),2);assert.equal(Number(sheet().cells['F'+row(deductions[1])].displayValue),4);
    const {projectMetrado,mergeMetradoWorkbook}=load('components/metrados/workbook.ts');
    const saved=JSON.parse(JSON.stringify(excel.getState().workbooks.Metrados));
    const restored=mergeMetradoWorkbook(saved,projectMetrado(model.getState()),'metrado');
    assert.equal(Number(restored.sheets[0].cells['F'+row(deductions[1])].displayValue),4);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),saved);
    assert.ok(report.pages.some(p=>p.rows.some(r=>r.cells.some(c=>c.text==='Descuento · Zapata'))));
    assert.ok(report.pages.some(p=>p.rows.some(r=>r.cells.some(c=>c.text.includes('Cálculo del área: =0.24*0.9')))));
    // An L section is the sum of two rectangles without overlapping their intersection.
    edit('H'+cr,'=0.60*0.20+0.20*0.40');edit('G'+cr,'0.8');
    assert.ok(Math.abs(Number(sheet().cells['M'+cr].displayValue)+.64)<1e-9);
    assert.ok(Math.abs(Number(sheet('resumen').cells['H'+sr].displayValue)-(23.2-.8-9.6-.64-1.032))<1e-9);
    const cs=()=>get().measurements.find(l=>l.id===column.id);
    assert.equal(cs().columnSection.areaExpression,'=0.60*0.20+0.20*0.40');
    assert.ok(Math.abs(cs().columnSection.area-.2)<1e-9);assert.equal(cs().sign,-1);
    edit('H'+cr,'-1');assert.equal(sheet().cells['M'+cr].displayValue,'#ERROR!');
    edit('H'+cr,'0.2');assert.ok(Math.abs(Number(sheet().cells['M'+cr].displayValue)+.64)<1e-9);
    edit('G'+cr,'0');assert.equal(sheet().cells['M'+cr].displayValue,'#ERROR!');
    edit('G'+cr,'');assert.equal(cs().pending,true);assert.equal(sheet().cells['M'+cr].rawValue,'');
    edit('G'+cr,'0.8');assert.equal(cs().pending,false);assert.equal(cs().resultRaw,undefined);
    const persisted=JSON.parse(JSON.stringify(model.getState().items));
    assert.equal(persisted.find(i=>i.id===item.id).measurements.find(l=>l.id===column.id).columnSection.buriedHeight,.8);
  }finally{stop();}
});

test('Home formats the current metrado, keeps Word focus, and leaves other module workbooks independent',()=>{
  reset();example();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');
    edit('D3','Detalle conservado');
    excel.getState().updateSheet(sheet().id,s=>({...s,currentCell:'D3',selectedCell:{row:2,col:3}}));
    const cells=sheet().cells, sheets=excel.getState().sheets;
    excel.getState().setActiveSection('Home');
    assert.equal(excel.getState().activeWorkbookId,'Metrados');assert.equal(excel.getState().sheets,sheets);assert.equal(sheet().cells,cells);assert.equal(sheet().currentCell,'D3');
    const {executeRibbonAction,setRibbonValue}=load('components/utils/useRibbon.ts');
    executeRibbonAction('underline');executeRibbonAction('center');executeRibbonAction('italic');setRibbonValue('color','#345678');
    assert.equal(sheet().cells.D3.underline,true);assert.equal(sheet().cells.D3.align,'center');assert.equal(sheet().cells.D3.italic,true);assert.equal(sheet().cells.D3.rawValue,'Detalle conservado');
    assert.equal(sheet().cells.M3.displayValue,'24');
    excel.getState().setActiveSection('Metrados');
    assert.equal(sheet().cells.D3.underline,true);
    edit('G3','5');assert.equal(sheet().cells.D3.align,'center');assert.equal(sheet().cells.D3.underline,true);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    const cell=report.pages.flatMap(p=>p.rows).flatMap(r=>r.cells).find(c=>c.text==='Detalle conservado');
    assert.equal(cell.underline,true);assert.equal(cell.italic,true);assert.equal(cell.align,'center');assert.equal(cell.color,'#345678');
    excel.getState().setViewMode('word');
    excel.getState().setActiveSection('Home');
    assert.equal(excel.getState().viewMode,'word');assert.equal(excel.getState().activeFocus,'word');
    const word=load('store/useWordEditorStore.ts').useWordEditorStore;
    const calls=[];const chain={focus(){calls.push('focus');return this},toggleUnderline(){calls.push('underline');return this},run(){calls.push('run');return true}};
    word.getState().setEditor({isDestroyed:false,chain:()=>chain});
    const before=sheet().cells;executeRibbonAction('underline');assert.deepEqual(calls,['focus','underline','run']);assert.equal(sheet().cells,before);
    word.getState().setEditor(null);
    excel.getState().setActiveSection('Metrados');assert.equal(excel.getState().viewMode,'word');
    excel.getState().setActiveSection('Costos');const costSheets=excel.getState().sheets;
    excel.getState().setActiveSection('Home');assert.equal(excel.getState().activeWorkbookId,'Costos');assert.equal(excel.getState().sheets,costSheets);
    excel.getState().openBlankWorkbook();assert.equal(excel.getState().activeWorkbookId,'blank');
    excel.getState().setActiveSection('Metrados');assert.equal(sheet().cells.D3.underline,true);
  }finally{stop();}
});

test('blank separators keep their position and editable label without shading, quantities or formula changes',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1']);
    const item=model.getState().items.find(item=>item.norma?.id==='OE.1.1.9.1');
    const first=item.measurements[0],second=item.measurements[1];
    const lineRow=line=>sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const row=lineRow(first),next=lineRow(second);
    edit('F'+row,'8');edit('G'+row,'2.5');edit('H'+row,'2.5');
    edit('F'+next,'4');edit('G'+next,'2.5');edit('H'+next,'2.5');
    edit('Z200',`=SUM(L${row}:L${next})`);edit('Z199',`="L${next}"`);
    excel.getState().updateSheet(sheet().id,s=>({...s,currentCell:'D'+row,selectedCell:{row:row-1,col:3}}));
    const {addMetradoSeparator,deleteMetradoRow}=load('components/metrados/syncWorkbook.ts');
    addMetradoSeparator();
    const changed=model.getState().items.find(entry=>entry.id===item.id),separator=changed.measurements[1],blank=lineRow(separator);
    assert.equal(separator.presentation,'separator');assert.equal(blank,row+1);assert.equal(lineRow(second),next+1);
    for(const col of 'DEFGHIJKLMNOP'){
      assert.equal(sheet().cells[col+blank].rawValue,'',col);
      assert.equal(sheet().cells[col+blank].backgroundColor,'#ffffff',col);
      assert.equal(sheet().cells[col+blank].input,false,col);
    }
    assert.equal(sheet().cells.Z201.rawValue,`=SUM(L${row}:L${next+1})`);
    assert.equal(sheet().cells.Z200.rawValue,`="L${next}"`);
    edit('D'+blank,'Vigas de cimentación');
    assert.equal(model.getState().items.find(entry=>entry.id===item.id).measurements[1].description,'Vigas de cimentación');
    assert.equal(load('store/useMetradoStore.ts').calculateItemTotal(model.getState().items.find(entry=>entry.id===item.id)),75);
    const summary=sheet('resumen'),sr=summary.template.rows[JSON.stringify(['item',item.id,'',''])];
    assert.equal(Number(summary.cells['H'+sr].displayValue),75);
    assert.ok(!load('components/metrados/normaCatalog.ts').reviewNormaItems([model.getState().items.find(entry=>entry.id===item.id)]).some(issue=>issue.kind==='error'));
    assert.equal(load('components/metrados/normaCatalog.ts').nextNormaDetailLabel(changed),'Trazo y replanteo · sector N-3');
    const saved=JSON.parse(JSON.stringify(excel.getState().workbooks.Metrados));
    const {mergeMetradoWorkbook,projectMetrado}=load('components/metrados/workbook.ts');
    const restored=mergeMetradoWorkbook(saved,projectMetrado(model.getState()),'metrado');
    assert.equal(restored.sheets[0].cells['D'+blank].rawValue,'Vigas de cimentación');
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),saved);
    assert.ok(report.pages.some(page=>page.sheet==='metrado'&&page.rows.some(row=>row.cells.some(cell=>cell.text==='Vigas de cimentación'))));
    excel.getState().updateSheet(sheet().id,s=>({...s,currentCell:'D'+blank,selectedCell:{row:blank-1,col:3},selectionEnd:undefined}));
    deleteMetradoRow();
    assert.equal(model.getState().items.find(entry=>entry.id===item.id).measurements.length,2);
    assert.equal(lineRow(second),next);
    assert.equal(Number(sheet('resumen').cells['H'+sr].displayValue),75);
  }finally{stop();}
});

test('entry shading follows the unit, supported swelling recalculates once and appears in the report',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1']);
    const item=model.getState().items.find(item=>item.norma?.id==='OE.1.1.3.1.1');
    const line=item.measurements[0],row=sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const itemRow=sheet().template.rows[JSON.stringify(['item',item.id,'',''])];
    for(const col of ['F','G','H','I','J'])assert.equal(sheet().cells[col+row].backgroundColor,inputColor,col);
    for(const col of ['D','E']){assert.equal(sheet().cells[col+row].input,false);assert.equal(sheet().cells[col+row].backgroundColor,'#ffffff',col);}
    assert.equal(sheet().cells['M'+row].input,false);assert.equal(sheet().cells['M'+row].backgroundColor,'#ffffff');
    edit('G'+row,'32.75');edit('H'+row,'19.30');edit('I'+row,'0.20');
    const {setSwelling}=load('components/metrados/measurementGuidance.ts');
    const current=model.getState().items.find(entry=>entry.id===item.id);
    const changed=setSwelling(current,current.measurements[0],1.5,'Material antes de esponjar; sustento del expediente','inSitu');
    model.getState().updateMeasurement(item.id,line.id,{swelling:changed.swelling});
    assert.ok(Math.abs(Number(sheet().cells['M'+row].displayValue)-189.6225)<1e-8);
    assert.equal(sheet().cells['M'+row].rawValue,`=F${row}*G${row}*H${row}*I${row}*J${row}*1.5`);
    assert.ok(Math.abs(Number(sheet().cells['P'+itemRow].displayValue)-189.6225)<1e-8);
    assert.equal(model.getState().items.find(entry=>entry.id===item.id).measurements[0].quantityOverride,undefined);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.flatMap(page=>page.rows).some(row=>row.cells.some(cell=>cell.text.includes('Factor de esponjamiento: 1.5'))));
    model.getState().updateItem(item.id,{unit:'m2'});
    assert.equal(sheet().cells['I'+row].input,false);assert.equal(sheet().cells['I'+row].backgroundColor,'#ffffff');
    assert.equal(model.getState().items.find(entry=>entry.id===item.id).measurements[0].swelling,undefined);
  }finally{stop();}
});
test('intervention reference areas precede disposal, calculate natively and stay out of payable totals',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1']);
    const heading=model.getState().items.find(item=>item.norma?.id==='OE.1.1.3.1');
    const garbage=model.getState().items.find(item=>item.norma?.id==='OE.1.1.3.1.1');
    const vegetation=model.getState().items.find(item=>item.norma?.id==='OE.1.1.3.1.2');
    const row=sheet().template.rows[JSON.stringify(['measurement',heading.id,heading.measurements[0].id,''])];
    assert.ok(row<sheet().template.rows[JSON.stringify(['item',garbage.id,'',''])]);
    assert.ok(row<sheet().template.rows[JSON.stringify(['item',vegetation.id,'',''])]);
    edit('G'+row,'32.75');edit('H'+row,'19.30');
    assert.equal(Number(sheet().cells['L'+row].displayValue),632.075);
    const headingRow=sheet().template.rows[JSON.stringify(['item',heading.id,'',''])];
    assert.equal(Number(sheet().cells['P'+headingRow].displayValue),632.075);
    assert.equal(load('components/utils/cellFormatting.ts').formatCellValue(sheet().cells['P'+headingRow]),'632.08');
    assert.ok(sheet().cells['P'+headingRow].hint.includes('en m²'));
    toggleQuispeExample();
    const backup=model.getState().demoBackup;
    model.setState({demoBackup:{...backup,workbook:{...backup.workbook,sheets:backup.workbook.sheets.map(s=>{
      if(s.id!==METRADO_SHEETS.metrado)return s;
      const cells={...s.cells},generated={...s.template.generated};delete cells['P'+headingRow];delete generated['P'+headingRow];
      return {...s,cells,template:{...s.template,generated}};
    })}}});
    toggleQuispeExample();
    assert.equal(Number(sheet().cells['P'+headingRow].displayValue),632.075);
    assert.equal(sheet().cells['G'+row].backgroundColor,inputColor);
    assert.equal(model.getState().items.find(item=>item.id===heading.id).measurements[0].referenceOnly,true);
    const summaryRow=sheet('resumen').template.rows[JSON.stringify(['item',heading.id,'',''])];
    assert.equal(Number(sheet('resumen').cells['F'+summaryRow].displayValue),632.075);
    assert.equal(Number(sheet('resumen').cells['H'+summaryRow].displayValue),632.075);
    assert.equal(load('components/utils/cellFormatting.ts').formatCellValue(sheet('resumen').cells['H'+summaryRow]),'632.08');
    assert.equal(sheet('resumen').cells['E'+summaryRow].rawValue,'m2');
    assert.ok(sheet('resumen').cells['D'+summaryRow].rawValue.includes('(REFERENCIA)'));
    model.getState().setSummaryFactor(1.5);
    assert.equal(Number(sheet('resumen').cells['H'+summaryRow].displayValue),632.075);
    assert.ok(!sheet('resumen').cells['G'+summaryRow].rawValue);
    const report=load('components/metrados/documentPreview.ts').buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.some(page=>page.sheet==='resumen'&&page.rows.some(row=>row.cells.some(cell=>cell.text.includes('ÁREA DE INTERVENCIÓN (REFERENCIA)'))&&row.cells.some(cell=>cell.text==='632.08'))));
    assert.equal(load('store/useMetradoStore.ts').calculateItemTotal(model.getState().items.find(item=>item.id===heading.id)),0);
    assert.ok(!load('components/metrados/normaCatalog.ts').reviewNormaItems(model.getState().items).some(issue=>issue.itemId===heading.id));
    model.getState().selectItem(heading.id);
    load('components/metrados/syncWorkbook.ts').addMetradoDetail();
    const reference=model.getState().items.find(item=>item.id===heading.id).measurements.at(-1);
    assert.equal(reference.description,'Área de intervención (referencia) · sector N-3');
    assert.equal(reference.referenceOnly,true);assert.equal(reference.kind,'area');assert.equal(reference.unit,'m2');
  }finally{stop();}
});

test('portable choice only suggests drainage review; explicit removal deletes the matched partida and renumbers its scope',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1','HU.1']);
    const source=model.getState().items.find(item=>item.norma?.id==='OE.1.1.1.6');
    const drainage=model.getState().items.find(item=>item.norma?.id==='OE.1.1.2.2');
    const {detailChoices}=load('components/metrados/detailChoices.ts');
    const {applyDetailChoice}=load('components/metrados/detailChoiceActions.ts');
    const result=applyDetailChoice(source.id,source.measurements[0].id,detailChoices(source).find(option=>option.mode==='global'));
    assert.equal(result.suggestDrainageReview,true);
    assert.ok(model.getState().items.some(item=>item.id===drainage.id));
    const {prepareMetradoItemDeletion,deleteMetradoRow}=load('components/metrados/syncWorkbook.ts');
    prepareMetradoItemDeletion(drainage.id);deleteMetradoRow();
    assert.ok(!model.getState().items.some(item=>item.id===drainage.id));
    assert.ok(model.getState().items.some(item=>item.norma?.id==='HU.1:remision:OE.1.1.2.2'));
    assert.equal(model.getState().items.find(item=>item.norma?.id==='OE.1.1.2.3').code,'OE.1.1.2.2');
    assert.ok(!Object.keys(sheet('resumen').template.rows).some(key=>JSON.parse(key)[1]===drainage.id));
    assert.ok(model.getState().items.some(item=>item.id===result.itemId));
    assert.throws(()=>prepareMetradoItemDeletion('missing'));
  }finally{stop();}
});
test('deleting comedor renumbers vestuario and subsequent items in grid and summary, preserving references after reload',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1']);
    const item=model.getState().items.find(i=>i.norma?.id==='OE.1.1.1.4');
    const row=sheet().template.rows[JSON.stringify(['item',item.id,'',''])];
    excel.getState().updateSheet(METRADO_SHEETS.metrado,s=>({...s,selectedCell:{row:row-1,col:3},selectionEnd:undefined,currentCell:'D'+row}));
    load('components/metrados/syncWorkbook.ts').deleteMetradoRow();
    const vestuario=model.getState().items.find(i=>i.norma?.id==='OE.1.1.1.5');
    assert.equal(vestuario.code,'OE.1.1.1.4');assert.equal(vestuario.norma.code,'OE.1.1.1.5');
    const itemRow=sheet().template.rows[JSON.stringify(['item',vestuario.id,'',''])];
    const summaryRow=sheet('resumen').template.rows[JSON.stringify(['item',vestuario.id,'',''])];
    assert.equal(sheet().cells['C'+itemRow].rawValue,'OE.1.1.1.4');
    assert.equal(sheet('resumen').cells['C'+summaryRow].rawValue,'OE.1.1.1.4');
    assert.equal(vestuario.measurements.length,2);
    stop();const resume=startMetradoWorkbookSync();resume();
    assert.equal(model.getState().items.find(i=>i.id===vestuario.id).code,'OE.1.1.1.4');
    assert.ok(!model.getState().items.some(i=>i.id===item.id));
  }finally{stop();}
});
test('choosing bathroom rental isolates its unit and updates the native grid, summary and print report',()=>{
  reset();const stop=startMetradoWorkbookSync();
  try{
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1']);
    const {detailChoices}=load('components/metrados/detailChoices.ts');
    const {applyDetailChoice}=load('components/metrados/detailChoiceActions.ts');
    const {buildMetradoReport}=load('components/metrados/documentPreview.ts');
    const source=model.getState().items.find(item=>item.norma?.id==='OE.1.1.1.6');
    const rowFor=(item,line)=>sheet().template.rows[JSON.stringify(['measurement',item.id,line.id,''])];
    const oldRow=rowFor(source,source.measurements[1]);edit('G'+oldRow,'2');edit('H'+oldRow,'3');
    const choice=detailChoices(source).find(option=>option.unit==='baño-mes');
    applyDetailChoice(source.id,source.measurements[0].id,choice);
    const variant=model.getState().items.find(item=>item.detailVariant?.sourceItemId===source.id);
    const row=rowFor(variant,variant.measurements[0]);
    const variantRow=sheet().template.rows[JSON.stringify(['item',variant.id,'',''])];
    assert.equal(sheet().cells['P'+variantRow].rawValue,'');
    assert.equal(sheet().cells['G'+row].rawValue,'');assert.equal(sheet().cells['O'+row].rawValue,'');
    edit('F'+row,'2');edit('G'+row,'3');
    const updated=model.getState().items.find(item=>item.id===variant.id);
    assert.equal(load('store/useMetradoStore.ts').calculateItemTotal(updated),6);
    assert.equal(load('store/useMetradoStore.ts').calculateItemTotal(model.getState().items.find(item=>item.id===source.id)),6);
    assert.equal(model.getState().items.find(item=>item.id===source.id).unit,'m2');
    const report=buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.ok(report.pages.filter(page=>page.sheet==='resumen').flatMap(page=>page.rows).some(row=>row.cells.some(cell=>cell.text===variant.description)&&row.cells.some(cell=>cell.text==='baño-mes')));
    const workbook=excel.getState().workbooks.Metrados;
    stop();const restarted=startMetradoWorkbookSync();
    try{assert.ok(model.getState().items.some(item=>item.detailVariant?.sourceItemId===source.id));assert.ok(workbook.sheets.length);}finally{restarted();}
  }finally{stop();}
});
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
  assert.equal(item.measurements.length,2);
  for(const line of item.measurements)model.getState().removeMeasurement(item.id,line.id);
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
    assert.equal(excel.getState().activeWorkbookId,'Costos');
    excel.getState().openBlankWorkbook();
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
    excel.getState().openBlankWorkbook(); assert.equal(Object.keys(excel.getState().sheets[0].cells).length,0);
  } finally { stop(); }
});

test("returning from Q7 upgrades saved real-project input shading without changing native data", () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); applyNormaTemplate(['OE.1']);
    const item=model.getState().items.find(item=>item.norma?.id==='OE.1.1.3.1.1');
    const row=sheet().template.rows[JSON.stringify(['measurement',item.id,item.measurements[0].id,''])];
    edit('G'+row,'32.75'); edit('Z200','Nota propia');
    excel.getState().setColumnWidth(METRADO_SHEETS.metrado,'D',421);
    toggleQuispeExample();
    const backup=model.getState().demoBackup;
    model.setState({demoBackup:{...backup,workbook:{...backup.workbook,sheets:backup.workbook.sheets.map(s=>({...s,
      template:{...s.template,formatVersion:11},
      cells:Object.fromEntries(Object.entries(s.cells).map(([address,c])=>[address,{...c,input:undefined,backgroundColor:c.input?'#ffffff':c.backgroundColor}]))
    }))}}});
    toggleQuispeExample();
    for(const col of ['F','G','H','I','J'])assert.equal(sheet().cells[col+row].backgroundColor,inputColor,col);
    for(const col of ['D','E','M'])assert.equal(sheet().cells[col+row].backgroundColor,'#ffffff',col);
    assert.equal(sheet().cells['G'+row].rawValue,'32.75');
    assert.equal(sheet().cells.Z200.rawValue,'Nota propia');
    assert.equal(sheet().colWidths.D,421);
    assert.equal(model.getState().demoBackup,undefined);
  } finally { stop(); }
});

test("returning from an older Q7 backup projects newly introduced reference areas without changing saved quantities", () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');applyNormaTemplate(['OE.1']);
    toggleQuispeExample();
    const backup=model.getState().demoBackup, oldItems=backup.model.items.map(item=>item.cleanupAreaTemplateVersion?{...item,cleanupAreaTemplateVersion:undefined,measurements:[]}:item);
    const {projectMetrado}=load('components/metrados/workbook.ts');
    const oldModel={...backup.model,items:oldItems};
    const upgraded=load('components/metrados/normaCatalog.ts').withNormaDetails(oldItems);
    model.setState({demoBackup:{model:{...oldModel,items:upgraded},workbook:{...backup.workbook,sheets:projectMetrado(oldModel)}}});
    toggleQuispeExample();
    const heading=model.getState().items.find(item=>item.norma?.id==='OE.1.1.3.1');
    const row=sheet().template.rows[JSON.stringify(['measurement',heading.id,heading.measurements[0].id,''])];
    assert.ok(row);assert.ok(sheet().cells['D'+row].rawValue.startsWith('Área de intervención (referencia)'));
    assert.equal(sheet().cells['G'+row].backgroundColor,inputColor);
  }finally{stop();}
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


test('clearing selected metrado sheets removes free cells too and preserves independent steel', () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); example();
    model.setState({steelSheetItems:structuredClone(model.getState().items)});
    edit('D25','Nota suelta'); edit('Z180','=2+3');
    excel.getState().setActiveSheet(METRADO_SHEETS.resumen); edit('Q33','Nota del resumen');
    excel.getState().setActiveSheet(METRADO_SHEETS.acero); edit('W55','Conservar acero');
    const { clearMetradoSheets } = load('components/metrados/syncWorkbook.ts');
    clearMetradoSheets(true,true);
    assert.equal(model.getState().items.length,0);
    assert.equal(sheet().cells.D25,undefined); assert.equal(sheet().cells.Z180,undefined);
    assert.equal(sheet('resumen').cells.Q33,undefined);
    assert.equal(sheet().cells.D1.rawValue,'Descripción');
    assert.equal(sheet('acero').cells.W55.rawValue,'Conservar acero');
    assert.equal(model.getState().steelSheetItems.length,1);
    stop(); const resume = startMetradoWorkbookSync(); resume();
    assert.equal(sheet().cells.D25,undefined);
  } finally { stop(); }
});

test('delete row removes manually entered rows across all columns and shifts following cells and formulas', () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados');
    edit('A2','Eliminar'); edit('Z3','También eliminar'); edit('D6','Conservar'); edit('F7','=2+3'); edit('G8','=F7');
    excel.getState().updateSheet(METRADO_SHEETS.metrado,s=>({...s,selectedCell:{row:1,col:0},selectionEnd:{row:3,col:6},currentCell:'A2'}));
    load('components/metrados/syncWorkbook.ts').deleteMetradoRow();
    assert.equal(sheet().cells.A2,undefined); assert.equal(sheet().cells.Z3,undefined);
    assert.equal(sheet().cells.D3.rawValue,'Conservar');
    assert.equal(sheet().cells.F4.rawValue,'=2+3');
    assert.equal(sheet().cells.G5.rawValue,'=F4'); assert.equal(Number(sheet().cells.G5.displayValue),5);
    assert.equal(sheet().cells.D1.rawValue,'Descripción');
  } finally { stop(); }
});

test('delete selected detail rows updates partidas and totals without restoring deleted notes', () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); const first=example(), second=example();
    edit('Q3','Nota en fila borrada'); edit('Q5','Nota que se mueve'); edit('R7','=G5');
    excel.getState().updateSheet(METRADO_SHEETS.metrado,s=>({...s,selectedCell:{row:2,col:0},selectionEnd:{row:2,col:25},currentCell:'A3',selectionMode:'row'}));
    load('components/metrados/syncWorkbook.ts').deleteMetradoRow();
    assert.equal(model.getState().items.find(i=>i.id===first).measurements.length,0);
    assert.equal(model.getState().items.find(i=>i.id===second).measurements.length,1);
    assert.equal(sheet().cells.Q3,undefined); assert.equal(sheet().cells.Q4.rawValue,'Nota que se mueve');
    assert.equal(sheet().cells.R6.rawValue,'=G4');
    assert.equal(Number(sheet().cells.P2.displayValue),0);
    assert.equal(Number(sheet().cells.P3.displayValue),24);
    stop(); const resume=startMetradoWorkbookSync(); resume();
    assert.equal(model.getState().items.find(i=>i.id===first).measurements.length,0);
  } finally { stop(); }
});

test('deleting a reverse row selection removes complete partidas and keeps the table heading', () => {
  reset(); const stop = startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); example(); example(); edit('Z20','Nota posterior');
    excel.getState().updateSheet(METRADO_SHEETS.metrado,s=>({...s,selectedCell:{row:4,col:6},selectionEnd:{row:0,col:0},currentCell:'G5'}));
    load('components/metrados/syncWorkbook.ts').deleteMetradoRow();
    assert.equal(model.getState().items.length,0); assert.equal(sheet().cells.D1.rawValue,'Descripción');
    assert.equal(sheet().cells.Z16.rawValue,'Nota posterior');
  } finally { stop(); }
});

test('header selection covers complete rows and columns and extends in either direction', () => {
  const { axisSelection }=load('components/utils/gridSelection.ts');
  const base={cells:{},selectedCell:null};
  const row=axisSelection(base,'row',4,200,26);
  assert.deepEqual({...row.selectedCell},{row:4,col:0}); assert.deepEqual({...row.selectionEnd},{row:4,col:25});
  const reverse=axisSelection({...base,...row},'row',2,200,26,true);
  assert.equal(reverse.selectedCell.row,4); assert.equal(reverse.selectionEnd.row,2);
  const column=axisSelection(base,'column',3,200,26);
  assert.deepEqual({...column.selectedCell},{row:0,col:3}); assert.deepEqual({...column.selectionEnd},{row:199,col:3});
  const all=axisSelection(base,'all',0,200,26);
  assert.deepEqual({...all.selectionEnd},{row:199,col:25});
});

test('row deletion updates absolute and range references without rewriting quoted text', () => {
  const { removeSheetRows }=load('components/utils/sheetRows.ts');
  const result=removeSheetRows({cells:{A1:cell('10'),A2:cell('20'),A3:cell('30'),B4:cell('=SUM($A$1:$A$3)'),C4:cell('=A2'),D4:cell('="A2"')},rowHeights:{'2':40,'3':35},manualRowHeights:['2','3'],hiddenRows:['2','3'],merges:['E1:E3'],selectedCell:null},new Set([2]));
  assert.equal(result.cells.B3.rawValue,'=SUM($A$1:$A$2)');
  assert.equal(result.cells.C3.rawValue,'=#REF!'); assert.equal(result.cells.D3.rawValue,'="A2"');
  assert.equal(result.rowHeights['2'],35); assert.equal(result.manualRowHeights[0],'2'); assert.equal(result.hiddenRows[0],'2');
  assert.equal(result.merges[0],'E1:E2');
});


test('deleting a Q7 steel row relocates source rows without changing independent Metrado', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); toggleQuispeExample();
    excel.getState().setActiveSheet(METRADO_SHEETS.acero);
    const beforeItems=JSON.stringify(model.getState().items);
    const first=model.getState().steelSheetItems.find(item=>item.steelLines.length>1);
    const target=first.steelLines[0], kept=first.steelLines[1];
    const lineKey=JSON.stringify(['steel',first.id,target.id,'']);
    const keptKey=JSON.stringify(['steel',first.id,kept.id,'']);
    const row=sheet('acero').template.rows[lineKey], keptRow=sheet('acero').template.rows[keptKey];
    excel.getState().updateSheet(METRADO_SHEETS.acero,s=>({...s,selectedCell:{row:row-1,col:0},currentCell:'A'+row,selectionEnd:undefined}));
    load('components/metrados/syncWorkbook.ts').deleteMetradoRow();
    assert.equal(model.getState().steelSheetItems.find(item=>item.id===first.id).steelLines.some(line=>line.id===target.id),false);
    assert.equal(sheet('acero').template.rows[keptKey],keptRow-1);
    assert.equal(JSON.stringify(model.getState().items),beforeItems);
  } finally { stop(); }
});

test('clearing only Resumen keeps manual Metrado and steel cells and all model data', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); example();
    edit('Z15','Conservar Metrado');
    excel.getState().setActiveSheet(METRADO_SHEETS.acero); edit('Z16','Conservar Acero');
    excel.getState().setActiveSheet(METRADO_SHEETS.resumen); edit('Z17','Quitar Resumen');
    const items=JSON.stringify(model.getState().items);
    load('components/metrados/syncWorkbook.ts').clearMetradoSheets(false,true);
    assert.equal(sheet().cells.Z15.rawValue,'Conservar Metrado'); assert.equal(sheet('acero').cells.Z16.rawValue,'Conservar Acero');
    assert.equal(sheet('resumen').cells.Z17,undefined); assert.equal(JSON.stringify(model.getState().items),items);
    assert.equal(model.getState().steelSheetItems,undefined);
  } finally { stop(); }
});


test('document preview includes native notes, calculated values and all three sheets without changing Word or model', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); example();
    edit('G3','=2+3'); edit('D20','Nota manual para el documento');
    excel.getState().setWordContent('<p>Documento Word original</p>',3);
    const before=JSON.stringify({model:model.getState(),word:excel.getState().word,workbook:excel.getState().workbooks.Metrados});
    const {buildMetradoReport}=load('components/metrados/documentPreview.ts');
    const report=buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.deepEqual(Array.from(new Set(report.pages.map(p=>p.sheet))),['metrado','acero','resumen']);
    const lines=report.pages.filter(p=>p.sheet==='metrado').flatMap(p=>p.rows);
    assert.equal(lines.find(r=>r.sourceRow===3).cells.find(c=>c.col===6).text,'5.00');
    assert.equal(lines.find(r=>r.sourceRow===20).cells.find(c=>c.col===3).text,'Nota manual para el documento');
    assert.equal(JSON.stringify({model:model.getState(),word:excel.getState().word,workbook:excel.getState().workbooks.Metrados}),before);
    assert.equal(report.pages.find(p=>p.sheet==='resumen').rows.some(r=>r.cells.some(c=>c.text==='60.00')),true);
  } finally { stop(); }
});

test('Q7 preview paginates every row, repeats table headers and retains steel merged headings', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); toggleQuispeExample();
    model.getState().updateHeader({project:'PROYECTO DE PRUEBA',owner:'Municipalidad',module:'MÓDULO A',preparedBy:'Responsable',reviewedBy:'Revisor'});
    const {buildMetradoReport,REPORT_HEIGHT,REPORT_MARGIN}=load('components/metrados/documentPreview.ts');
    const report=buildMetradoReport(model.getState(),excel.getState().workbooks.Metrados);
    assert.equal(report.header.project,'PROYECTO DE PRUEBA'); assert.equal(report.header.reviewedBy,'Revisor');
    assert.ok(report.pages.length>3);
    for(const page of report.pages){
      const rows=page.rows.map(r=>r.sourceRow);
      assert.equal(rows.length,new Set(rows).size);
      assert.ok(page.headings.length>0);
      const total=report.headerHeight+page.headings.reduce((n,r)=>n+r.height,0)+page.rows.reduce((n,r)=>n+r.height,0)+24;
      assert.ok(total<=REPORT_HEIGHT-REPORT_MARGIN*2,'Content must fit inside a printable page');
    }
    const steel=report.pages.find(p=>p.sheet==='acero');
    assert.equal(steel.headings.length,2); assert.ok(steel.headings[0].cells.some(c=>c.span>1));
    for(const view of ['metrado','acero','resumen']){
      const rows=report.pages.filter(p=>p.sheet===view).flatMap(p=>p.rows.map(r=>r.sourceRow));
      for(let i=1;i<rows.length;i++)assert.equal(rows[i],rows[i-1]+1);
    }
  } finally { stop(); }
});

test('empty preview still contains three titled sheets without invented quantities', () => {
  reset(); const {buildMetradoReport}=load('components/metrados/documentPreview.ts');
  const report=buildMetradoReport(model.getState());
  assert.equal(report.pages.length,3);
  assert.equal(report.pages[0].rows.length,0); assert.equal(report.pages[2].rows.length,0);
  assert.ok(report.pages.every(page=>page.label&&page.headings.length));
});


test('Word export contains the three tables, project data, landscape paper and repeated headings', async () => {
  reset(); const id=example(); model.getState().updateHeader({project:'Proyecto <Consejo> & revisión',preparedBy:'Responsable'});
  const {buildMetradoReport}=load('components/metrados/documentPreview.ts');
  const {metradoReportDocx}=load('components/metrados/documentDocx.ts');
  const {Packer}=require('docx'), JSZip=require('jszip');
  const report=buildMetradoReport(model.getState());
  const zip=await JSZip.loadAsync(await Packer.toBuffer(metradoReportDocx(report)));
  const xml=await zip.file('word/document.xml').async('string');
  assert.ok(xml.includes('HOJA DE METRADOS')); assert.ok(xml.includes('HOJA DE METRADO DE ACERO')); assert.ok(xml.includes('RESUMEN DE METRADOS'));
  assert.ok(xml.includes('Proyecto &lt;Consejo&gt; &amp; revisión'));
  assert.ok(xml.includes('w:orient="landscape"')); assert.ok(xml.includes('w:tblHeader'));
  assert.ok(xml.includes('24.00')); assert.ok(model.getState().items.some(item=>item.id===id));
});


test('copying two office dimensions pastes both cells and recalculates the destination detail', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Metrados'); applyNormaTemplate(['OE.1']);
    const office=model.getState().items.find(i=>i.norma?.id==='OE.1.1.1.1');
    const first=office.measurements[0];
    const lines=model.getState().items.find(i=>i.id===office.id).measurements;
    const sourceRow=sheet().template.rows[JSON.stringify(['measurement',office.id,lines[0].id,''])];
    const destinationRow=sheet().template.rows[JSON.stringify(['measurement',office.id,lines[1].id,''])];
    edit('D'+sourceRow,'Oficina de Residencia'); edit('G'+sourceRow,'5.90'); edit('H'+sourceRow,'2.50');
    excel.getState().updateSheet(METRADO_SHEETS.metrado,s=>({...s,selectedCell:{row:sourceRow-1,col:6},selectionEnd:{row:sourceRow-1,col:7},currentCell:'G'+sourceRow}));
    const {copyCellRange,pasteCellRange}=load('components/utils/gridClipboard.ts');
    const copy=copyCellRange(sheet()); assert.equal(copy.text,'5.90\t2.50');
    excel.getState().updateSheet(METRADO_SHEETS.metrado,s=>({...s,selectedCell:{row:destinationRow-1,col:6},selectionEnd:undefined,currentCell:'G'+destinationRow}));
    pasteCellRange(copy.text,JSON.stringify(copy.range));
    assert.equal(sheet().cells['G'+destinationRow].rawValue,'5.90'); assert.equal(sheet().cells['H'+destinationRow].rawValue,'2.50');
    assert.equal(Number(sheet().cells['L'+destinationRow].displayValue),14.75);
    assert.equal(sheet().cells['D'+destinationRow].rawValue,'Oficina de supervisión');
    assert.equal(model.getState().items.find(i=>i.id===office.id).measurements[1].pending,false);
    assert.equal(sheet().cells['G'+sourceRow].rawValue,'5.90');
  } finally {stop();}
});

test('external rectangular TSV pastes once, includes empty cells and preserves destination format', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Home');
    const id=excel.getState().activeSheetId;
    excel.getState().updateSheet(id,s=>({...s,cells:{...s.cells,A1:{...cell('old'),bold:true}},selectedCell:{row:0,col:0},selectionEnd:undefined,currentCell:'A1'}));
    const {pasteCellRange}=load('components/utils/gridClipboard.ts');
    const revision=excel.getState().contentRevision;
    pasteCellRange('11\t12\r\n13\t\r\n','',true);
    const current=excel.getState().sheets[0];
    assert.equal(current.cells.A1.rawValue,'11'); assert.equal(current.cells.B1.rawValue,'12'); assert.equal(current.cells.A2.rawValue,'13'); assert.equal(current.cells.B2.rawValue,'');
    assert.equal(current.cells.A1.bold,true); assert.equal(excel.getState().contentRevision,revision+1);
    assert.equal(current.selectionEnd.row,1); assert.equal(current.selectionEnd.col,1);
  } finally {stop();}
});

test('range copy shifts relative formula references and retains absolute references and quoted text', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Home'); const id=excel.getState().activeSheetId;
    excel.getState().updateSheet(id,s=>({...s,cells:{A1:cell('2'),B1:cell('=A1+$A$1'),A2:cell('3')},selectedCell:{row:0,col:1},selectionEnd:undefined,currentCell:'B1'}));
    const {copyCellRange,pasteCellRange,moveCopiedFormula}=load('components/utils/gridClipboard.ts');
    const copy=copyCellRange(excel.getState().sheets[0]);
    excel.getState().updateSheet(id,s=>({...s,selectedCell:{row:1,col:1},currentCell:'B2'}));
    pasteCellRange(copy.text,JSON.stringify(copy.range));
    const current=excel.getState().sheets[0];
    assert.equal(current.cells.B2.rawValue,'=A2+$A$1'); assert.equal(Number(current.cells.B2.displayValue),5);
    assert.equal(moveCopiedFormula('=SUM(A1:B2)+$A1+A$1+$A$1+"A1"',2,1),'=SUM(B3:C4)+$A3+B$1+$A$1+"A1"');
  } finally {stop();}
});

test('clipboard parser preserves quoted multiline text and tabs', () => {
  const {parseClipboardTable}=load('components/utils/gridClipboard.ts');
  const parsed=parseClipboardTable('"primera\nsegunda"\t"con\ttab"\r\n"comillas ""dobles"""\t2\r\n');
  assert.equal(parsed.length,2); assert.equal(parsed[0][0],'primera\nsegunda'); assert.equal(parsed[0][1],'con\ttab'); assert.equal(parsed[1][0],'comillas "dobles"');
});

test('pasting one value fills a selected range and invalid width leaves the sheet untouched', () => {
  reset(); const stop=startMetradoWorkbookSync();
  try {
    excel.getState().setActiveSection('Home'); const id=excel.getState().activeSheetId;
    excel.getState().updateSheet(id,s=>({...s,selectedCell:{row:2,col:3},selectionEnd:{row:3,col:4},currentCell:'D3'}));
    const {pasteCellRange}=load('components/utils/gridClipboard.ts');
    pasteCellRange('7','',true);
    assert.equal(excel.getState().sheets[0].cells.D3.rawValue,'7'); assert.equal(excel.getState().sheets[0].cells.E4.rawValue,'7');
    excel.getState().updateSheet(id,s=>({...s,selectedCell:{row:0,col:25},selectionEnd:undefined,currentCell:'Z1'}));
    const before=excel.getState().sheets[0].cells;
    assert.throws(()=>pasteCellRange('1\t2','',true));
    assert.equal(excel.getState().sheets[0].cells,before);
  } finally {stop();}
});
