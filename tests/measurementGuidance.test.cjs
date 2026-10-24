const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {measurementGuidance,setSwelling}=load('components/metrados/measurementGuidance.ts');
const {createNormaItems,NORMA_BY_ID}=load('components/metrados/normaCatalog.ts');
const {calculateMeasurement}=load('store/useMetradoStore.ts');
const items=createNormaItems(['OE.1','OE.2','HU.3']);
const find=id=>items.find(item=>item.norma?.id===id);
test('cleanup is a heading with m3 and m2 children and the corrected scope includes off-site transport',()=>{
  assert.equal(find('OE.1.1.3.1').kind,'chapter');assert.equal(find('OE.1.1.3.1').unit,'');
  assert.equal(find('OE.1.1.3.1.1').unit,'m3');assert.equal(find('OE.1.1.3.1.2').unit,'m2');
  assert.ok(NORMA_BY_ID.get('OE.1.1.3.1.1').measurement.includes('transporte de desperdicios fuera de la obra'));
  assert.ok(!NORMA_BY_ID.get('OE.1.1.3.1.1').measurement.includes('cómputo de su remoción'));
  assert.equal(measurementGuidance(find('OE.2.1.6')).policy,'metrado');
  assert.equal(measurementGuidance(find('HU.3.4.4.3')).policy,'apu');
});
test('the screenshot arithmetic matches but its multiplier requires an explicit supported basis',()=>{
  const item=find('OE.1.1.3.1.1'),line={...item.measurements[0],pending:false,length:32.75,width:19.3,height:.2};
  assert.ok(Math.abs(calculateMeasurement(line)-126.415)<1e-8);
  const changed=setSwelling(item,line,1.5,'Material y medición de campo documentados en expediente','inSitu');
  assert.ok(Math.abs(calculateMeasurement(changed)-189.6225)<1e-8);
  assert.equal(changed.repetitions,1);assert.equal(line.swelling,undefined);
  assert.throws(()=>setSwelling(item,line,1.5,'','inSitu'));
  assert.throws(()=>setSwelling(item,line,1.5,'Estudio','loose'));
  assert.throws(()=>setSwelling(item,line,NaN,'Estudio','inSitu'));
  assert.throws(()=>setSwelling(item,{...line,resultRaw:'=200',quantityOverride:200},1.5,'Estudio','inSitu'));
  assert.equal(setSwelling(item,changed,1,'','').swelling,undefined);
});
test('an APU factor or an area measurement cannot be applied as swelling to the metrado',()=>{
  const apu=find('HU.3.4.4.3');assert.throws(()=>setSwelling(apu,apu.measurements[0],1.5,'Estudio','inSitu'));
  const area=find('OE.1.1.3.1.2');assert.throws(()=>setSwelling(area,area.measurements[0],1.5,'Estudio','inSitu'));
});
