const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript'), { performance } = require('node:perf_hooks');
const cache = new Map(); let writes = 0, bytes = 0;
const storage = { getItem: () => null, setItem: (_, value) => { writes++; bytes += value.length; }, removeItem() {} };
function load(file) {
  file = path.resolve(file); if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'));
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file,mod);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports:mod.exports,module:mod,structuredClone,localStorage:storage,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,require:id=>id.startsWith('@/')?load(id.slice(2)+'.ts'):id.startsWith('.')?load(path.resolve(path.dirname(file),id)+(id.endsWith('.json')?'':'.ts')):require(id)});
  return mod.exports;
}
const {useWexelStore:excel}=load('store/useWexelStore.ts');
const {startMetradoWorkbookSync}=load('components/metrados/syncWorkbook.ts');
const {toggleQuispeExample}=load('components/metrados/exampleTemplate.ts');
const {beginEdit,commitEdit}=load('components/utils/excelEditing.ts');
const stop=startMetradoWorkbookSync(); excel.getState().setActiveSection('Metrados'); toggleQuispeExample();
let contentChanges=0;const un=excel.subscribe((a,b)=>{if(a.sheets[0].cells!==b.sheets[0].cells)contentChanges++;});
writes=bytes=0;const start=performance.now();
for(let r=4;r<24;r++) { commitEdit();excel.getState().updateSheet('metrados-metrado',s=>({...s,currentCell:'D'+r,selectedCell:{row:r-1,col:3},selectionEnd:undefined,formulaInput:s.cells['D'+r]?.rawValue??''}));beginEdit('D'+r); }
commitEdit();
console.log(JSON.stringify({selections:20,stateMilliseconds:Math.round((performance.now()-start)*100)/100,contentChanges,storageWrites:writes,serializedMB:Math.round(bytes/1e4)/100}));
const { layoutRows } = load('components/utils/virtualRows.ts');
const rows=Array.from({length:300},(_,i)=>String(i+1));
const beforeSheets=excel.getState().sheets;
const geometry=new Map(beforeSheets.map(sheet=>[sheet.id,layoutRows(sheet,rows)]));
let reusedLayouts=0; writes=bytes=contentChanges=0;
const switchStart=performance.now(), revision=excel.getState().contentRevision;
for(let round=0;round<10;round++)for(const sheet of beforeSheets){
  excel.getState().setActiveSheet(sheet.id);
  const active=excel.getState().sheets.find(s=>s.id===sheet.id);
  if(layoutRows(active,[...rows])===geometry.get(sheet.id))reusedLayouts++;
}
console.log(JSON.stringify({sheetSwitches:30,stateAndGeometryMilliseconds:Math.round((performance.now()-switchStart)*100)/100,reusedLayouts,contentChanges,revisionChanges:excel.getState().contentRevision-revision,navigationWrites:writes,serializedBytes:bytes}));
un();stop();
const {applyNormaTemplate}=load('components/metrados/normaTemplate.ts');
const {NORMA_SECTIONS}=load('components/metrados/normaCatalog.ts');
const {encodeSnapshot,decodeSnapshot}=load('store/storageCodec.ts');
const createStart=performance.now();applyNormaTemplate(NORMA_SECTIONS.map(s=>s.code));
const creationMilliseconds=performance.now()-createStart;
const snapshot={state:excel.persist.getOptions().partialize(excel.getState()),version:0};
const raw=JSON.stringify(snapshot),compressedStart=performance.now(),encoded=encodeSnapshot(snapshot);
const compressionMilliseconds=performance.now()-compressedStart;
const recovered=decodeSnapshot(encoded);
if(recovered.state.workbooks.Metrados.sheets.length!==snapshot.state.workbooks.Metrados.sheets.length)throw Error('Incomplete recovery');
console.log(JSON.stringify({normativeRows:855,creationMilliseconds:Math.round(creationMilliseconds),nativeSnapshotCharacters:raw.length,compressedCharacters:encoded.length,compressionMilliseconds:Math.round(compressionMilliseconds),underLocalStorageQuota:encoded.length<2000000}));
const stopNorm = startMetradoWorkbookSync();
const {useMetradoStore:model}=load('store/useMetradoStore.ts');
const {changeDraft}=load('components/utils/excelEditing.ts');
const firstDetail=model.getState().items.find(item=>item.norma&&item.measurements.length);
const main=excel.getState().workbooks.Metrados.sheets.find(sheet=>sheet.id==='metrados-metrado');
const detailRow=main.template.rows[JSON.stringify(['measurement',firstDetail.id,firstDetail.measurements[0].id,''])];
excel.getState().setActiveSheet('metrados-metrado');
beginEdit('G'+detailRow);changeDraft('6');const commitStart=performance.now();commitEdit();
console.log(JSON.stringify({fullTemplateEditMilliseconds:Math.round(performance.now()-commitStart)}));
stopNorm();
