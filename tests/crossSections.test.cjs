const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {setCrossSectionMethod}=load('components/metrados/crossSections.ts');
const {calculateMeasurement}=load('store/useMetradoStore.ts');
const {createNormaItems}=load('components/metrados/normaCatalog.ts');
const {setSwelling}=load('components/metrados/measurementGuidance.ts');
const cut=createNormaItems(['OE.2']).find(item=>item.norma.id==='OE.2.1.3');

test('column section uses real area and buried height without reinterpreting existing dimensions',()=>{
  const {setColumnSection}=load('components/metrados/crossSections.ts');
  const original={...cut.measurements[0],crossSections:undefined,length:2,width:.6,height:.2,sign:-1,expressions:{length:'2',width:'0.6',height:'0.2'}};
  const changed=setColumnSection(original);
  assert.equal(changed.columnSection.areaExpression,'');assert.equal(changed.columnSection.heightExpression,'');
  assert.equal(changed.length,2);assert.equal(changed.width,.6);assert.equal(changed.height,.2);
  const measured={...changed,pending:false,columnSection:{...changed.columnSection,area:.2,buriedHeight:.8,areaExpression:'=0.6*0.2+0.2*0.4',heightExpression:'0.8'}};
  assert.ok(Math.abs(calculateMeasurement(measured)+.16)<1e-9);
  assert.ok(Number.isNaN(calculateMeasurement({...measured,columnSection:{...measured.columnSection,area:0}})));
  const restored=setCrossSectionMethod(measured,'geometry');
  assert.equal(restored.columnSection,undefined);assert.equal(restored.width,.6);assert.equal(restored.expressions.height,'0.2');
  assert.throws(()=>setColumnSection({...original,resultRaw:'=100'}));
  assert.throws(()=>setSwelling({...cut,norma:undefined,description:'Proyecto'},measured,1.5,'estudio','inSitu'));
  const fill=createNormaItems(['OE.2']).find(i=>i.norma.id==='OE.2.1.4.1');
  assert.ok(load('components/metrados/detailChoices.ts').detailChoices(fill).some(o=>o.columnArea));
});
test('cut templates use extreme areas without inventing quantities or applying swelling',()=>{
  const line=cut.measurements[0];assert.equal(line.crossSections.method,'endAreas');assert.equal(line.pending,true);
  assert.equal(line.crossSections.expressions.initialArea,'');assert.throws(()=>setSwelling(cut,line,1.5,'estudio','inSitu'));
  const measured={...line,pending:false,length:5,crossSections:{...line.crossSections,initialArea:8,finalArea:13.972}};
  assert.ok(Math.abs(calculateMeasurement(measured)-54.93)<1e-9);
  assert.equal(calculateMeasurement({...measured,crossSections:{...measured.crossSections,initialArea:0,finalArea:8}}),20);
  assert.ok(Number.isNaN(calculateMeasurement({...measured,crossSections:{...measured.crossSections,finalArea:-1}})));
});
test('switching methods preserves original geometry but does not reinterpret width as area',()=>{
  const geometric={...cut.measurements[0],crossSections:undefined,length:5,width:10.99,height:0};
  const changed=setCrossSectionMethod(geometric,'meanArea');assert.equal(changed.width,10.99);assert.equal(changed.height,0);assert.equal(changed.crossSections.expressions.meanArea,'');
  assert.ok(Math.abs(calculateMeasurement({...changed,pending:false,crossSections:{...changed.crossSections,meanArea:10.986}})-54.93)<1e-9);
  assert.equal(setCrossSectionMethod(changed,'geometry').crossSections,undefined);
  assert.throws(()=>setCrossSectionMethod({...geometric,resultRaw:'=100'},'endAreas'));
});

test('fill methods distinguish compacted massive volumes from geometric voids and forbid swelling',()=>{
  const {detailChoices}=load('components/metrados/detailChoices.ts');
  const {chooseDetail}=load('components/metrados/selectDetailChoice.ts');
  const {measurementGuidance}=load('components/metrados/measurementGuidance.ts');
  const fills=createNormaItems(['OE.2','HU.2']).filter(item=>['OE.2.1.4.1','OE.2.1.4.2','HU.2.1.3'].includes(item.norma.id));
  for(const item of fills){
    const options=detailChoices(item);
    for(const mode of ['endAreas','meanArea','geometry'])assert.ok(options.some(option=>option.crossSectionMethod===mode),item.code);
    assert.equal(measurementGuidance(item).policy,'compacted');
    assert.throws(()=>setSwelling(item,item.measurements[0],1.2,'estudio','inSitu'));
    const selected=chooseDetail([item],item.id,item.measurements[0].id,options.find(o=>o.id==='fill-section:endAreas'),'volume').items[0].measurements[0];
    assert.equal(selected.pending,true);assert.equal(selected.crossSections.expressions.initialArea,'');
    assert.equal(calculateMeasurement({...selected,pending:false,length:10,crossSections:{...selected.crossSections,initialArea:6,finalArea:10}}),80);
    if(item.norma.id.startsWith('OE.'))assert.equal(item.measurements[0].crossSections,undefined);
    else assert.equal(item.measurements[0].crossSections.method,'endAreas');
  }
});
