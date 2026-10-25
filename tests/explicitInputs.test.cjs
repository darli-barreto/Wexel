const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {projectMetrado,readMetradoSheet,reconcileMetradoSheet}=load('components/metrados/workbook.ts');
const {exposeProjectInputs}=load('components/metrados/explicitInputs.ts');
const {useMetradoStore}=load('store/useMetradoStore.ts');
const {COLORS}=load('config/colors.ts');
const line=patch=>({id:'line',description:'Excavación',unit:'m3',kind:'volume',pending:false,similarElements:8,length:2.5,width:2.5,height:1.6,repetitions:1,sign:1,...patch});
const state=lines=>({...useMetradoStore.getState(),items:[{id:'item',parentId:null,kind:'item',code:'01',description:'Prueba',unit:'m3',order:0,measurements:lines,steelLines:[]}],collapsedItemIds:[]});
const row=(s,id)=>s.template.rows[JSON.stringify(['measurement','item',id,''])];
test('persisted inputs restore the section formula, remain editable and use single line labeled cells only',()=>{
 let model=state([line({crossSections:{method:'meanArea',initialArea:0,finalArea:0,meanArea:0,expressions:{initialArea:'',finalArea:'',meanArea:'=G999*H999'},support:''},formulaInputs:[{id:'b',label:'Ancho sección (m)',value:'2.5'},{id:'h',label:'Profundidad (m)',value:'1.6'}],formulaTemplates:{meanArea:'=@{b}*@{h}'}})]);
 let sheet=projectMetrado(model)[0],r=row(sheet,'line');assert.equal(Number(sheet.cells['M'+r].displayValue),80);
 const previous=structuredClone(sheet),binding=JSON.stringify(['measurement','item','line','meanArea']);
 previous.cells['H'+r].rawValue='=G999*H999';previous.template.generated['H'+r].rawValue=sheet.cells['H'+r].rawValue;
 const repaired=reconcileMetradoSheet(previous,sheet);assert.equal(Number(repaired.cells['M'+r].displayValue),80,'semantic templates replace obsolete positional formulas');
 assert.equal(repaired.template.generated['H'+r].key,binding);
 const [address]=Object.entries(sheet.template.generated).find(([,v])=>v.key===JSON.stringify(['formulaInput','item','line','b']));
 const h=Number(address.slice(1))-1;
 assert.equal(sheet.cells['G'+h].rawValue,'b sec. (m)');assert.equal(sheet.cells['G'+h].hint,'Ancho sección (m)');assert.equal(sheet.cells['G'+h].wrapText,false);assert.equal(sheet.cells['D'+h].align,'left');assert.equal(sheet.cells['D'+h].backgroundColor,COLORS.excel.cell);assert.equal(sheet.cells['A'+h].backgroundColor,COLORS.excel.cell);assert.equal(sheet.cells['G'+h].backgroundColor,COLORS.metrado.heading);assert.equal(sheet.rowHeights[h],21);
 sheet.cells[address]={...sheet.cells[address],rawValue:'3',displayValue:'3'};
 model={...model,...readMetradoSheet(sheet,model)};sheet=projectMetrado(model)[0];r=row(sheet,'line');assert.ok(Math.abs(Number(sheet.cells['M'+r].displayValue)-96)<1e-9);
});
test('end areas calculate a visible mean once and preserve unrounded volume',()=>{
 const model=state([line({similarElements:1,length:5,crossSections:{method:'endAreas',initialArea:8.97,finalArea:13,meanArea:0,expressions:{initialArea:'8.97',finalArea:'13',meanArea:''},support:''}})]);
 const sheet=projectMetrado(model)[0],r=row(sheet,'line');assert.equal(Number(sheet.cells['K'+r].displayValue),10.985);assert.equal(Number(sheet.cells['M'+r].displayValue),54.925);assert.equal(sheet.cells['K'+(r-1)].rawValue,'Am (m²)');assert.equal(sheet.cells['K'+r].input,false);
});
test('embedded geometric operands become editable inputs without changing the result',()=>{
 const items=exposeProjectInputs(state([line({columnSection:{element:'stripFooting',area:.42,buriedHeight:.6,areaExpression:'=0.7*0.6',heightExpression:'0.6'}})]).items);
 const sheet=projectMetrado({...state([]),items})[0],r=row(sheet,'line');assert.ok(items[0].measurements[0].formulaInputs.length===2);assert.ok(Math.abs(Number(sheet.cells['M'+r].displayValue)-2.016)<1e-9);
});
