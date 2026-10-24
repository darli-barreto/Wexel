const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {createNormaItems,withNormaDetails}=load('components/metrados/normaCatalog.ts');
const {withSobrecimientoFormwork,linkSobrecimientoFormwork,formworkConcrete}=load('components/metrados/sobrecimientoFormwork.ts');

test('simple and reinforced sobrecimientos link only sibling concrete and preserve deletions',()=>{
  const items=createNormaItems(['OE.2']);
  for(const code of ['OE.2.2.6.2','OE.2.3.5.2']){
    const target=items.find(item=>item.norma.code===code);
    assert.equal(target.measurements.length,4);
    const concrete=formworkConcrete(items,target);
    assert.equal(concrete.parentId,target.parentId);
    assert.ok(target.measurements.every(line=>line.formworkSource.itemId===concrete.id));
    const deleted={...target,measurements:target.measurements.slice(1)};
    const saved=items.map(item=>item.id===target.id?deleted:item);
    assert.equal(withNormaDetails(saved).find(item=>item.id===target.id),deleted);
    assert.equal(linkSobrecimientoFormwork(items,target).measurements.length,4);
  }
});

test('migration preserves entered measurements and custom labels; explicit sync incorporates new sources once',()=>{
  const items=createNormaItems(['OE.2']);
  const target=items.find(item=>item.norma.code==='OE.2.2.6.2');
  const manual={...target,formworkTemplateVersion:undefined,measurements:[{...target.measurements[0],formworkSource:undefined,length:3,pending:false}]};
  const saved=items.map(item=>item.id===target.id?manual:item);
  assert.equal(withSobrecimientoFormwork(saved),saved);
  assert.equal(linkSobrecimientoFormwork(saved,manual).measurements[0],manual.measurements[0]);
  const concrete=formworkConcrete(items,target);
  const added={...concrete,measurements:[...concrete.measurements,{...concrete.measurements[0],id:'new-sc',description:'SC-3'}]};
  const synced=linkSobrecimientoFormwork(items.map(item=>item.id===concrete.id?added:item),target);
  assert.equal(synced.measurements.length,6);
});
