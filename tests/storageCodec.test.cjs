const test=require('node:test'),assert=require('node:assert/strict');
const {encodeSnapshot,decodeSnapshot}=require('./loadTypeScript.cjs')('store/storageCodec.ts');
test('large styled sheets compress losslessly including Unicode, formulas and older plain snapshots',()=>{
  const small={state:{text:'ÁREA Ø 3/8″',formula:'=SUM(A1:A4)',size:9},version:1};
  assert.deepEqual(decodeSnapshot(JSON.stringify(small)),small);
  const value={...small,cells:Array.from({length:40000},(_,i)=>({rawValue:i%2?'EXCAVACIÓN':'=F3*G3*H3',displayValue:'24.00',backgroundColor:'#f0f2f4',fontFamily:'Helvetica, sans-serif',fontSize:9,bold:true,align:'left',dependencies:[]}))};
  const encoded=encodeSnapshot(value);
  assert.ok(encoded.length<JSON.stringify(value).length*.15);
  assert.deepEqual(decodeSnapshot(encoded),value);
});
