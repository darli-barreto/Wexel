const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {renumberAfterDelete}=load('components/metrados/renumberAfterDelete.ts');
const {createNormaItems,repairNormaDeletionGaps}=load('components/metrados/normaCatalog.ts');
test('deleting a normative sibling closes its gap while preserving ids, data and normative codes',()=>{
  const before=createNormaItems(['OE.1']);const removed=before.find(i=>i.norma?.id==='OE.1.1.1.4');
  const after=renumberAfterDelete(before,before.filter(i=>i!==removed),new Set([removed.id]));
  const changed=after.find(i=>i.norma?.id==='OE.1.1.1.5');
  assert.equal(changed.code,'OE.1.1.1.4');assert.equal(changed.norma.code,'OE.1.1.1.5');
  assert.equal(changed.measurements,before.find(i=>i.id===changed.id).measurements);
  assert.equal(after.find(i=>i.norma?.id==='OE.1.1.2').code,'OE.1.1.2');
});
test('deleting a chapter rebases every descendant and multiple sibling deletions stay contiguous',()=>{
  const before=createNormaItems(['OE.1']),chapter=before.find(i=>i.norma?.id==='OE.1.1.1');
  const deleted=new Set([chapter.id]);let changed=true;
  while(changed){changed=false;for(const item of before)if(deleted.has(item.parentId)&&!deleted.has(item.id)){deleted.add(item.id);changed=true;}}
  const after=renumberAfterDelete(before,before.filter(i=>!deleted.has(i.id)),deleted);
  assert.equal(after.find(i=>i.norma?.id==='OE.1.1.2').code,'OE.1.1.1');
  assert.equal(after.find(i=>i.norma?.id==='OE.1.1.2.1.1').code,'OE.1.1.1.1.1');
  const targets=new Set(before.filter(i=>['OE.1.1.1.1','OE.1.1.1.4'].includes(i.norma?.id)).map(i=>i.id));
  const compact=renumberAfterDelete(before,before.filter(i=>!targets.has(i.id)),targets);
  assert.equal(compact.find(i=>i.norma?.id==='OE.1.1.1.2').code,'OE.1.1.1.1');
  assert.equal(compact.find(i=>i.norma?.id==='OE.1.1.1.5').code,'OE.1.1.1.3');
});
test('existing saved gaps repair idempotently without reinstating deleted items or renumbering unselected scopes',()=>{
  const all=createNormaItems(['OE.2']);
  assert.equal(repairNormaDeletionGaps(all),all);
  assert.equal(all.find(i=>!i.parentId).code,'OE.2');
  const before=createNormaItems(['OE.1']),filtered=before.filter(i=>i.norma?.id!=='OE.1.1.1.4');
  const repaired=repairNormaDeletionGaps(filtered);
  assert.equal(repaired.length,filtered.length);assert.equal(repaired.find(i=>i.norma?.id==='OE.1.1.1.5').code,'OE.1.1.1.4');
  assert.equal(repairNormaDeletionGaps(repaired),repaired);
});
test('custom numbering keeps padding, decorators and unaffected branches',()=>{
  const make=(id,code,parentId,order)=>({id,code,parentId,order,kind:'item',description:id,unit:'m2',measurements:[],steelLines:[]});
  const before=[make('root','P02-S',null,0),make('a','P02.01-S','root',0),make('b','P02.02-S','root',1),make('c','P02.03-S','root',2),make('grandchild','P02.03.01-S','c',0)];
  const result=renumberAfterDelete(before,before.filter(i=>i.id!=='b'),new Set(['b']),{prefix:'P',suffix:'-S'});
  assert.equal(result.find(i=>i.id==='c').code,'P02.02-S');assert.equal(result.find(i=>i.id==='grandchild').code,'P02.02.01-S');
});
