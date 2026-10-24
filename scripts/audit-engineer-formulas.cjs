// Independent saved Excel caches compared with Wexel's actual formula engine.
const fs=require('node:fs'),load=require('../tests/loadTypeScript.cjs');
const {processFormula,parseCellRef}=load('components/utils/excel.ts');
function evaluateSheet(sheet,overrides={}){
  const rows=Array.from({length:sheet.maxRow},(_,i)=>String(i+1));
  const columns=Array.from({length:sheet.maxCol},(_,i)=>{let n=i+1,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;});
  const matrix=rows.map(()=>Array(columns.length));
  for(const [address,cell] of Object.entries(sheet.cells)){
    const p=parseCellRef(address,rows.length,columns.length);
    matrix[p.row][p.col]={rawValue:overrides[address]??cell.formula??String(cell.value??''),displayValue:String(cell.value??''),dependencies:[]};
  }
  return formula=>processFormula(formula,matrix,rows,columns).displayValue;
}
function auditWorkbook(source){
 const report={source:source.source,method:'Actual Wexel formula evaluation vs saved Excel caches; no VBA execution.',sheets:[]};
 for(const sheet of source.sheets){
  const evaluate=evaluateSheet(sheet);
  const checks=[];
  for(const [address,cell] of Object.entries(sheet.cells))if(cell.formula){
    const actual=evaluate(cell.formula);
    const pass=typeof cell.value==='number'?Number.isFinite(Number(actual))&&Math.abs(Number(actual)-cell.value)<=1e-8*Math.max(1,Math.abs(cell.value)):actual===String(cell.value??'');
    checks.push({cell:address,formula:cell.formula,expected:cell.value,actual,pass});
  }
  report.sheets.push({name:sheet.name,total:checks.length,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),checks});
 }
 return report;
}
module.exports={auditWorkbook,evaluateSheet};
if(require.main===module){
 const report=auditWorkbook(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
 fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.sheets.map(({checks,...s})=>s),null,2));
}
