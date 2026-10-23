const test=require('node:test'), assert=require('node:assert/strict');
const load=require('./loadTypeScript.cjs');
const {NORMA_ENTRIES,NORMA_SOURCE,NORMA_SECTIONS,NORMA_BY_ID,createNormaItems,reviewNormaItems,normaUnitKind}=load('components/metrados/normaCatalog.ts');
const source=require('../components/metrados/data/norma-catalog.json');

test('standard catalogue covers every extracted heading and all thirteen scopes without orphan levels',()=>{
  assert.equal(NORMA_SOURCE.pages,156);
  assert.equal(source.entries.length,799);
  assert.equal(NORMA_SECTIONS.length,13);
  const items=createNormaItems(NORMA_SECTIONS.map(s=>s.code)),ids=new Set(items.map(i=>i.id));
  assert.equal(items.length,NORMA_ENTRIES.length);
  assert.equal(ids.size,items.length);
  assert.equal(items.filter(i=>!i.parentId).length,13);
  assert.equal(items[0].code,'OE.1');
  for(const item of items){
    assert.ok(!item.parentId||ids.has(item.parentId),item.code);
    assert.equal(item.measurements.length,item.kind==='item'?1:0); assert.equal(item.steelLines.length,0);
    if(item.kind==='item') { assert.equal(item.measurements[0].pending,true); assert.equal(item.measurements[0].expressions.length,''); }
    assert.equal(item.description,item.description.toUpperCase());
    assert.ok(item.norma.pages.length>0,item.code);
    const seen=new Set([item.id]);let parent=items.find(i=>i.id===item.parentId);
    while(parent){assert.ok(!seen.has(parent.id));seen.add(parent.id);parent=items.find(i=>i.id===parent.parentId);}
  }
});
test('printed duplicates, alternative units and cross-reference extensions remain explicit',()=>{
  const excavations=NORMA_ENTRIES.filter(e=>e.code==='OE.2.1.2.1');
  assert.equal(excavations.length,2);assert.ok(excavations.every(e=>e.ambiguousCode));
  assert.notEqual(excavations[0].id,excavations[1].id);
  assert.deepEqual(NORMA_BY_ID.get('OE.1.1.1.7').options,['m','m2']);
  assert.equal(NORMA_BY_ID.get('OE.1.1.1.7').unit,'');
  assert.equal(NORMA_BY_ID.get('OE.2.3.7.1').unit,'m3');
  assert.ok(createNormaItems(['OE.2']).find(i=>i.norma.id==='OE.2.3.7.1').norma.pages.includes(39));
  assert.equal(NORMA_BY_ID.get('OE.2.3.7.2').unit,'m2');
  assert.equal(NORMA_BY_ID.get('OE.2.3.7.3').unit,'kg');
  assert.equal(NORMA_BY_ID.get('OE.2.2.8.1').unit,'m2'); // Printed ramp criterion includes thickness specification.
  assert.equal(NORMA_BY_ID.get('HU.3.20.8').unit,'h');
  assert.equal(normaUnitKind('km'),'length');assert.equal(normaUnitKind('h'),'units');
  const hu=createNormaItems(['HU.1']);
  assert.ok(hu.some(i=>i.norma.inheritedFrom==='OE.1.1.1.1'&&i.norma.code==='OE.1.1.1.1'));
  assert.ok(NORMA_ENTRIES.some(e=>e.derivedKind==='own'&&e.inheritedFrom==='OE.1.2.1'&&e.unit==='glb'));
});
test('catalogue insertion is idempotent and review distinguishes pending quantities from incorrect units',()=>{
  const items=createNormaItems(['OE.2']);
  assert.equal(createNormaItems(['OE.2'],items).length,0);
  const concrete=items.find(i=>i.norma.id==='OE.2.3.7.1');
  assert.ok(reviewNormaItems([concrete]).some(i=>i.kind==='pending'));
  assert.ok(reviewNormaItems([{...concrete,unit:'m2'}]).some(i=>i.kind==='error'));
  assert.ok(!reviewNormaItems([concrete]).some(i=>i.kind==='error'));
});
