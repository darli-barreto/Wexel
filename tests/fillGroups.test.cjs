const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {createNormaItems}=load('components/metrados/normaCatalog.ts');
const {insertFillGroup}=load('components/metrados/fillGroups.ts');
const source=()=>createNormaItems(['OE.2']).find(i=>i.norma.id==='OE.2.1.4.1');

test('existing details can become a strip footing deduction while retaining their measured dimensions',()=>{
  const item=source(),line=item.measurements[0];
  Object.assign(line,{pending:false,length:.86,width:.6,height:1,repetitions:1,sign:1,expressions:{length:'0.86',width:'0.6',height:'1',repetitions:'1'}});
  const option=load('components/metrados/detailChoices.ts').detailChoices(item).find(o=>o.id==='fill-deduction:stripFooting');
  const result=load('components/metrados/selectDetailChoice.ts').chooseDetail([item],item.id,line.id,option,'volume');
  const changed=result.items[0].measurements[0];
  assert.equal(result.items[0].measurements.length,item.measurements.length);assert.equal(changed.sign,-1);
  assert.equal(changed.expressions.repetitions,'-1');assert.equal(changed.length,.86);assert.equal(changed.width,.6);
  assert.equal(changed.columnSection.element,'stripFooting');
  assert.equal(changed.columnSection.areaExpression,'');assert.equal(changed.columnSection.heightExpression,'');
  assert.ok(Math.abs(load('store/useMetradoStore.ts').calculateMeasurement({...changed,pending:false,columnSection:{...changed.columnSection,area:.86,buriedHeight:.6}})+.516)<1e-9);
});

test('fill groups seed empty excavations and negative linked deductions without supplying example dimensions',()=>{
  for(const type of ['footing','gradeBeam','stripFooting']){
    const item=source(),result=insertFillGroup(item,item.measurements[0].id,type);
    assert.equal(result.preservedSelected,false);
    const lines=result.item.measurements,excavation=lines.find(l=>l.id===result.lineId);
    assert.equal(lines[0].presentation,'separator');assert.equal(excavation.fillGroup.role,'excavation');
    assert.equal(excavation.pending,true);assert.equal(excavation.sign,1);
    const deductions=lines.filter(l=>l.fillGroup?.role==='deduction');assert.ok(deductions.length>=2);
    for(const line of deductions){assert.equal(line.sign,-1);assert.equal(line.quantitySourceId,excavation.id);assert.equal(line.expressions.repetitions,'-1');assert.equal(line.expressions.height,'');assert.equal(line.length,0);assert.equal(line.width,0);assert.equal(line.height,0);}
    if(type==='footing'){const column=deductions.find(l=>l.description==='Descuento · Columna o pedestal');assert.equal(column.columnSection.areaExpression,'');assert.equal(column.columnSection.heightExpression,'');assert.equal(deductions.at(-1).description,'Descuento · Cimiento corrido');}
    if(type==='gradeBeam')assert.deepEqual(deductions.map(l=>l.description),['Descuento · Viga de cimentación y tecnopor','Descuento · Cimiento corrido','Descuento · Sobrecimiento enterrado']);
    assert.equal(lines.at(-1),item.measurements[1]);
  }
});

test('all explicit occupied-volume choices retain entered geometry and set negative repetitions',()=>{
  const {detailChoices}=load('components/metrados/detailChoices.ts');
  const {chooseDetail}=load('components/metrados/selectDetailChoice.ts');
  for(const id of ['solado','footing','soladoFooting','gradeBeam','gradeBeamEps','eps','plinth','stripFootingPrism','other']){
    const item=source(),line=item.measurements[0];
    Object.assign(line,{length:1.2,width:.25,height:.5,repetitions:2,expressions:{length:'1.2',width:'0.25',height:'0.5',repetitions:'2'}});
    const option=detailChoices(item).find(o=>o.id==='fill-deduction:'+id);assert.ok(option,id);
    const selected=chooseDetail([item],item.id,line.id,option,'volume').items[0].measurements[0];
    assert.equal(selected.sign,-1);assert.equal(selected.repetitions,2);assert.equal(selected.expressions.repetitions,'-2');
    assert.equal(selected.length,1.2);assert.equal(selected.width,.25);assert.equal(selected.height,.5);
    assert.equal(selected.columnSection,undefined);assert.equal(selected.crossSections,undefined);
  }
});

test('group insertion preserves entered dimensions, custom descriptions and formulas rather than reinterpreting them',()=>{
  for(const patch of [{description:'Mi medición pendiente'},{length:2,expressions:{length:'=1+1'}},{resultRaw:'=100',quantityOverride:100},{similarElements:4},{columnSection:{area:.2,buriedHeight:0,areaExpression:'0.2',heightExpression:''}}]){
    const item=source();item.measurements[0]={...item.measurements[0],...patch};
    const before=item.measurements[0],result=insertFillGroup(item,before.id,'footing');
    assert.equal(result.preservedSelected,true);assert.equal(result.item.measurements[0],before);
    assert.equal(result.item.measurements[1].presentation,'separator');
  }
});
