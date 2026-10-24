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
    assert.equal(item.measurements.length,item.formworkTemplateVersion?4:item.kind==='item'||item.cleanupAreaTemplateVersion?2:0); assert.equal(item.steelLines.length,0);
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
  const fences=createNormaItems(['OE.1','HU.1']).filter(item=>item.norma?.code==='OE.1.1.1.7');
  assert.equal(fences.length,2);
  for(const fence of fences){assert.equal(fence.unit,'m');assert.ok(fence.measurements.every(line=>line.unit==='m'&&line.kind==='length'&&line.pending));}
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


test('every measurable normative item starts with distinct blank details, including separate formwork faces and ends',()=>{
  const items=createNormaItems(NORMA_SECTIONS.map(s=>s.code));
  for(const item of items.filter(i=>i.kind==='item')){
    assert.equal(item.measurements.length,item.formworkTemplateVersion?4:2,item.code);
    assert.ok(item.measurements.every(line=>line.description.trim()),item.code);
    assert.notEqual(item.measurements[0].description,item.measurements[1].description,item.code);
    for(const line of item.measurements){
      assert.equal(line.pending,true); assert.equal(line.length,0); assert.equal(line.width,0); assert.equal(line.height,0); assert.equal(line.manualQuantity,0);
      for(const name of ['length','width','height','manualQuantity'])assert.equal(line.expressions[name],'');
    }
  }
  const caseta=items.find(i=>i.norma.id==='OE.1.1.1.3');
  assert.deepEqual(caseta.measurements.map(line=>line.description),['Caseta N-1','Caseta N-2']);
  const office=items.find(i=>i.norma.id==='OE.1.1.1.1');
  assert.deepEqual(office.measurements.map(line=>line.description),['Oficina de Residencia','Oficina de supervisión']);
});

test('cleanup area details identify sectors and upgrade only untouched labels, preserving quantities and deletions',()=>{
  const {withNormaDetails,nextNormaDetailLabel}=load('components/metrados/normaCatalog.ts');
  const items=createNormaItems(['OE.1','HU.1']);
  for(const item of items.filter(i=>i.norma.code==='OE.1.1.3.1.2')){
    assert.deepEqual(item.measurements.map(line=>line.description),['Superficie con maleza · sector N-1','Superficie con maleza · sector N-2']);
    const saved={...item,measurements:[{...item.measurements[0],description:'Eliminación de maleza y arbustos de fácil extracción · paño N-1',length:32.75,width:19.3,pending:false},{...item.measurements[1],description:'Jardín entre ejes A–D'}]};
    const [updated]=withNormaDetails([saved]);
    assert.equal(updated.measurements[0].description,'Superficie con maleza · sector N-1');
    assert.equal(updated.measurements[0].length,32.75); assert.equal(updated.measurements[0].width,19.3);assert.equal(updated.measurements[0].pending,false);
    assert.equal(updated.measurements[1],saved.measurements[1]);
    assert.equal(nextNormaDetailLabel(updated),'Superficie con maleza · sector N-3');
    const stable=[updated];assert.equal(withNormaDetails(stable),stable);
    assert.equal(withNormaDetails([{...updated,measurements:[]}])[0].measurements.length,0);
  }
  const heading=items.find(i=>i.norma.id==='OE.1.1.3.1');
  assert.ok(heading.measurements.every(line=>line.referenceOnly&&line.pending&&line.kind==='area'));
  assert.equal(heading.measurements[0].description,'Área de intervención (referencia) · sector N-1');
  const deleted=[{...heading,measurements:[]}];assert.equal(withNormaDetails(deleted),deleted);
});

test('detail labels use the work context without confusing masonry with structural concrete',()=>{
  const {normaDetailLabel}=load('components/metrados/normaDetailLabels.ts');
  assert.equal(normaDetailLabel('PARA EL CONCRETO',['COLUMNAS'],1,'m3'),'Columna C-1 · Concreto');
  assert.equal(normaDetailLabel('PARA EL ENCOFRADO Y DESENCOFRADO',['ZAPATAS'],2,'m2'),'Zapata Z-2 · Encofrado y desencofrado');
  assert.ok(normaDetailLabel('MUROS DE LADRILLO DE CONCRETO',[],1,'m2').startsWith('Muros de ladrillo'));
  assert.ok(normaDetailLabel('TABLAESTACADO PARA EXCAVACIONES DE ZANJAS',[],1,'m2').startsWith('Tablaestacado'));
  assert.ok(normaDetailLabel('RELLENO DE ZANJAS',[],1,'m3').startsWith('Relleno y compactación'));
  assert.ok(normaDetailLabel('CONDUCTORES DE COMUNICACIONES',[],1,'m').endsWith('tramo N-1'));
});

test('detail upgrade preserves edits, quantities and deleted scaffolds and runs only once',()=>{
  const {withNormaDetails,nextNormaDetailLabel}=load('components/metrados/normaCatalog.ts');
  const caseta=createNormaItems(['OE.1']).find(i=>i.norma.id==='OE.1.1.1.3');
  const original={...caseta,detailTemplateVersion:1,measurements:[{...caseta.measurements[0],description:'Caseta del ingreso principal',pending:false,length:5,expressions:{length:'5'}}]};
  const [upgraded]=withNormaDetails([original]);
  assert.equal(upgraded.measurements.length,2); assert.equal(upgraded.measurements[0].description,'Caseta del ingreso principal');
  assert.equal(upgraded.measurements[0].length,5); assert.equal(upgraded.measurements[0].expressions.length,'5');
  assert.equal(upgraded.measurements[1].description,'Caseta N-2');
  assert.equal(nextNormaDetailLabel(upgraded),'Caseta N-3');
  const existing=[upgraded]; assert.equal(withNormaDetails(existing),existing);
  const [deleted]=withNormaDetails([{...caseta,detailTemplateVersion:1,measurements:[]}]);
  assert.equal(deleted.measurements.length,0);
  const [blank]=withNormaDetails([{...caseta,detailTemplateVersion:1,measurements:[{...caseta.measurements[0],description:''}]}]);
  assert.equal(blank.measurements[0].description,'Caseta N-1');
  const [custom]=withNormaDetails([{...original,measurements:[{...original.measurements[0],id:'manual'}]}]);
  assert.equal(custom.measurements.length,1);
});
