const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('components/utils/excel.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText;
const sandbox = {exports:{}};
vm.runInNewContext(code,sandbox,{codeGeneration:{strings:false,wasm:false}});
const {processFormula} = sandbox.exports;
const rows=['1','2','3'], cols=['A','B','C'];
const cell = rawValue => ({rawValue,displayValue:rawValue,dependencies:[]});
const data = [[cell('10'),cell('20'),cell('')],[cell('5'),cell(''),cell('')],[cell(''),cell(''),cell('')]];
const result = (formula, matrix=data) => processFormula(formula,matrix,rows,cols).displayValue;
test('unfinished formulas do not execute or raise console errors',()=>{
 assert.equal(result('='),'');assert.equal(result('=  '),'');assert.equal(result('=A1+'),'#ERROR!');assert.equal(result('=SUM('),'#ERROR!');
});
test('arithmetic, parentheses, repeated references and percentages',()=>{
 assert.equal(result('=A1+B1'),'30');assert.equal(result('=(A1+B1)*2'),'60');assert.equal(result('=A1+A1'),'20');assert.equal(result('=50%*10'),'5');assert.equal(result('=2^3'),'8');
});
test('range and nested aggregate functions including Spanish aliases',()=>{
 assert.equal(result('=SUM(A1:B2)'),'35');assert.equal(result('=SUMA(A1;B1)+A2'),'35');assert.equal(result('=AVERAGE(A1:B2)'),'11.666666666666666');assert.equal(result('=SUM(MAX(A1,B1),A2)'),'25');assert.equal(processFormula('=SUM(A1:B2)',data,rows,cols).dependencies.length,4);
});
test('invalid arithmetic and code-like input produce cell errors',()=>{
 assert.equal(result('=1/0'),'#DIV/0!');assert.equal(result('=Z999'),'#REF!');assert.equal(result('=UNKNOWN(1)'),'#NAME?');assert.equal(result('=globalThis.alert(1)'),'#ERROR!');
});
test('dependencies recalculate from raw values independently of row order',()=>{
 const matrix=data.map(row=>row.map(c=>({...c})));matrix[0][0]=cell('=B1+1');matrix[0][1]=cell('=A2*2');assert.equal(result('=A1',matrix),'11');matrix[1][0]=cell('8');assert.equal(result('=A1',matrix),'17');
});
test('circular references become a cell error',()=>{
 const matrix=data.map(row=>row.map(c=>({...c})));matrix[0][0]=cell('=B1');matrix[0][1]=cell('=A1');assert.equal(result('=A1',matrix),'#CIRC!');
});
