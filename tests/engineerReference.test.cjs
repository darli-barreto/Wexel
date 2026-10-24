const test=require('node:test'),assert=require('node:assert/strict');
const source=require('../docs/auditoria-q7/libro-ingeniero.json');
const {auditWorkbook,evaluateSheet}=require('../scripts/audit-engineer-formulas.cjs');

test('Wexel recalculates every saved numeric formula from the engineer reference, independently of cached results',()=>{
 const report=auditWorkbook(source);
 const main=report.sheets.find(s=>s.name==='Metrado'),steel=report.sheets.find(s=>s.name==='Acero');
 assert.equal(main.total,381);assert.equal(main.passed,381);
 const numeric=steel.checks.filter(c=>typeof c.expected==='number');
 assert.equal(numeric.length,102);assert.ok(numeric.every(c=>c.pass));
});

test('changing an office dimension updates its area and the partida total instead of replaying the Excel cache',()=>{
 const main=source.sheets.find(s=>s.name==='Metrado');
 const evaluate=evaluateSheet(main,{G21:'6'});
 assert.equal(Number(evaluate(main.cells.L21.formula)),15);
 assert.equal(Number(evaluate(main.cells.P20.formula)),44.75);
 assert.equal(main.cells.P20.value,44.5);
});

test('changing a steel element count updates the detailed weight and source partida total',()=>{
 const steel=source.sheets.find(s=>s.name==='Acero');
 const row=Object.keys(steel.cells).find(a=>/^V\d+$/.test(a)&&steel.cells[a].formula&&typeof steel.cells['F'+a.slice(1)]?.value==='number');
 assert.ok(row);
 const input='F'+row.slice(1),before=steel.cells[input].value;
 const evaluate=evaluateSheet(steel,{[input]:String(before*2)});
 assert.ok(Math.abs(Number(evaluate(steel.cells[row].formula))-steel.cells[row].value*2)<1e-8);
 const total=Object.entries(steel.cells).find(([a,c])=>/^W\d+$/.test(a)&&c.formula?.includes('SUM')&&Number(a.slice(1))<Number(row.slice(1)));
 assert.ok(total);assert.ok(Number(evaluate(total[1].formula))>total[1].value);
});
