const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {createNormaItems,NORMA_SECTIONS}=load('components/metrados/normaCatalog.ts');
const {detailChoices}=load('components/metrados/detailChoices.ts');
const {chooseDetail,restoreDetailVariant}=load('components/metrados/selectDetailChoice.ts');
const {relatedProvisionalDrainage,drainageHasEnteredData}=load('components/metrados/provisionalServices.ts');
const items=createNormaItems(NORMA_SECTIONS.map(section=>section.code));
const find=code=>items.find(item=>item.norma?.id===code);

test('cimientos corridos accept an irregular plan area times height as concrete volume',()=>{
  const item=items.find(item=>item.kind==='item' && item.description==='CIMIENTOS CORRIDOS' && item.unit==='m3');
  assert.ok(item);
  const option=detailChoices(item).find(option=>option.id==='strip-footing:area-height');
  assert.ok(option);
  const line={id:'irregular-footing',description:'',unit:'m3',kind:'volume',similarElements:1,repetitions:1,sign:1,length:0,width:0,height:0};
  const result=chooseDetail([{...item,measurements:[line]}],item.id,line.id,option,'volume');
  const changed=result.items[0].measurements[0];
  assert.equal(changed.columnSection.element,'stripFooting');
  assert.equal(changed.sign,1);
  assert.equal(changed.columnSection.areaExpression,'');
  const measured={...changed,pending:false,columnSection:{...changed.columnSection,area:12.5,buriedHeight:.6}};
  assert.equal(load('store/useMetradoStore.ts').calculateMeasurement(measured),7.5);
});
test('every measurable catalogue item has contextual choices with unique ids and explanations',()=>{
  for(const item of items.filter(item=>item.kind==='item')){
    const options=detailChoices(item); assert.ok(options.length>=3,item.code);
    assert.equal(new Set(options.map(option=>option.id)).size,options.length,item.code);
    for(const option of options) {assert.ok(option.label.trim());assert.ok(option.help.trim());}
  }
});
test('offices, guardhouses and bathrooms expose their actual work alternatives',()=>{
  const office=detailChoices(find('OE.1.1.1.1')).map(option=>option.label).join('|');
  for(const word of ['Residencia','Supervisión','Administración','Reuniones'])assert.ok(office.includes(word));
  assert.ok(detailChoices(find('OE.1.1.1.3')).some(option=>option.label.includes('vehicular')));
  const bathroom=detailChoices(find('OE.1.1.1.6'));
  assert.ok(bathroom.some(option=>option.unit==='glb'));
  assert.ok(bathroom.some(option=>option.unit==='baño-mes'));
  assert.ok(bathroom.some(option=>option.unit==='m2'));
});

test('safety catalogue includes named PSST, PPE, collective protection and global measurement guidance',()=>{
  const {detailQuantityHint}=load('components/metrados/detailChoices.ts');
  for(const prefix of ['', 'HU.1:remision:']){
    const own=find('app:own:'+prefix+'OE.1.2.1');
    assert.ok(detailChoices(own).some(option=>option.label==='Plan de Seguridad y Salud en el Trabajo'));
    for(const code of ['OE.1.2.1.2','OE.1.2.1.3','OE.1.2.1.4','OE.1.2.2']){
      const item=find(prefix+code);assert.ok(detailChoices(item).length>=8,code);
      assert.ok(detailQuantityHint(item).includes('No sumes un global'));
    }
    const ppe=find(prefix+'OE.1.2.1.1');assert.equal(ppe.unit,'und');
    const labels=detailChoices(ppe).map(option=>option.label).join('|');
    for(const word of ['Casco','Gafas','Guantes','Calzado','auditiva','respiratoria','Arnés','Reposición'])assert.ok(labels.includes(word),word);
    assert.ok(detailChoices(ppe).every(option=>!option.unit));
    assert.ok(detailQuantityHint(ppe).includes('EPP en und'));
    assert.ok(!detailChoices(find(prefix+'OE.1.2.1.2')).some(option=>option.label.includes('Arnés')));
  }
});

test('all thirteen scopes have specific construction choices except three intentionally open normative items',()=>{
  const generic=items.filter(item=>item.kind==='item'&&detailChoices(item)[0].id.startsWith('identifier:')).map(item=>item.norma.id).sort();
  assert.deepEqual(generic,['HU.3.1','HU.4.1','OE.4.7']);
  for(const scope of NORMA_SECTIONS){
    const scoped=items.filter(item=>item.kind==='item'&&item.norma.id.startsWith(scope.code));
    assert.ok(scoped.some(item=>detailChoices(item).length>=5),scope.code);
  }
});

test('new work examples preserve measurements and do not create unrequested units or quantities',()=>{
  for(const code of ['OE.1.2.1.1','OE.1.2.1.2','OE.2.3.7.1','OE.3.7.10','OE.4.1.2','OE.5.2.5','app:own:OE.6.1','HU.3.20.1','HU.5.1.1']){
    const source=structuredClone(find(code)),line=source.measurements[0];
    Object.assign(line,{pending:false,length:5.9,width:2.5,similarElements:3,resultRaw:'=2+3',expressions:{length:'=5+0.9',width:'2.5'}});
    const option=detailChoices(source).find(option=>option.id.startsWith('work:'));
    assert.ok(option,code);
    const changed=chooseDetail([source],source.id,line.id,option,line.kind).items[0].measurements[0];
    assert.deepEqual({...changed,description:line.description},line,code);
  }
});

test('reference-area suggestions work without assigning a unit to the normative heading',()=>{
  const source=find('OE.1.1.3.1'),line=source.measurements[0];
  const changed=chooseDetail([source],source.id,line.id,detailChoices(source)[0],'area').items[0];
  assert.equal(changed.unit,'');assert.equal(changed.measurements[0].unit,'m2');assert.equal(changed.measurements[0].referenceOnly,true);
});
test('preliminary layout offers editable footing and foundation identifiers without seeding example quantities',()=>{
  for(const source of [find('OE.1.1.9.1'),find('HU.1:remision:OE.1.1.9.1')]){
    const options=detailChoices(source);
    for(const name of ['Zapata Z-1','Zapata Z-2','Zapata Z-3','Zapata Z-4','Viga de cimentación · ejes A y C / 1–2','Viga de cimentación · ejes A y C / 2–3','Cimiento corrido · tramo entre ejes'])assert.ok(options.some(o=>o.label===name),name);
    assert.ok(options.find(o=>o.label==='Zapata Z-1').help.includes('no necesariamente'));
    const line=source.measurements[0];
    const result=chooseDetail([source],source.id,line.id,options.find(o=>o.label==='Zapata Z-1'),'area');
    const changed=result.items[0].measurements[0];
    assert.equal(changed.description,'Zapata Z-1');assert.equal(changed.pending,true);assert.equal(changed.expressions.length,'');assert.equal(changed.expressions.width,'');
  }
  assert.ok(!detailChoices(find('OE.1.1.9.2')).some(o=>o.id.startsWith('layout-preliminary:')));
  const {measurementGuidance}=load('components/metrados/measurementGuidance.ts');
  assert.ok(measurementGuidance(find('OE.1.1.9.1')).scope.includes('evita duplicar encuentros'));
});

test('same-unit choices preserve dimensions, custom formulas and other details',()=>{
  const source=structuredClone(find('OE.1.1.1.1'));
  source.measurements[0]={...source.measurements[0],length:5.9,width:2.5,pending:false,expressions:{length:'=5+0.9',width:'2.5'}};
  const result=chooseDetail([source],source.id,source.measurements[0].id,detailChoices(source)[1],'area');
  assert.equal(result.items[0].measurements[0].length,5.9);
  assert.equal(result.items[0].measurements[0].expressions.length,'=5+0.9');
  assert.equal(result.items[0].measurements[1],source.measurements[1]);
  assert.equal(source.measurements[0].description,'Oficina de Residencia');
});
test('rental alternatives create a separate pending total and reuse only the same unit and title',()=>{
  const source=find('OE.1.1.1.6'),option=detailChoices(source).find(option=>option.unit==='glb');
  const first=chooseDetail([source],source.id,source.measurements[0].id,option,'units');
  const target=first.items.find(item=>item.id===first.itemId);
  assert.equal(target.unit,'glb');assert.equal(target.norma,undefined);
  assert.equal(target.detailVariant.reference.code,source.norma.code);
  assert.equal(target.measurements[0].pending,true);assert.equal(target.measurements[0].expressions.manualQuantity,'');
  assert.equal(first.items.find(item=>item.id===source.id).measurements.length,1);
  const restored=restoreDetailVariant(first.items,target.id,target.measurements[0].id);
  assert.equal(restored.items.length,1);assert.deepEqual(restored.items[0].measurements,source.measurements);
  assert.throws(()=>restoreDetailVariant(first.items.filter(item=>item.id!==source.id),target.id,target.measurements[0].id));
  const second=chooseDetail(first.items,source.id,source.measurements[1].id,option,'units');
  assert.equal(second.itemId,target.id);assert.equal(second.items.length,2);
  assert.notEqual(second.items[1].measurements[0].description,second.items[1].measurements[1].description);
  assert.throws(()=>chooseDetail([],source.id,'missing',option,'units'));
});

test('portable bathroom review matches the same project scope and respects the keep decision',()=>{
  const all=createNormaItems(['OE.1','HU.1']);
  const sanitary=all.find(item=>item.norma?.id==='OE.1.1.1.6');
  const drainage=relatedProvisionalDrainage(all,sanitary.id);
  assert.equal(drainage.norma.id,'OE.1.1.2.2');assert.equal(drainageHasEnteredData(drainage),false);
  const huSanitary=all.find(item=>item.norma?.id==='HU.1:remision:OE.1.1.1.6');
  assert.equal(relatedProvisionalDrainage(all,huSanitary.id).norma.id,'HU.1:remision:OE.1.1.2.2');
  const renamed=all.map(item=>({...item,code:'PROYECTO-'+item.order}));
  assert.equal(relatedProvisionalDrainage(renamed,sanitary.id).id,drainage.id);
  assert.equal(relatedProvisionalDrainage(all.map(item=>item.id===drainage.id?{...item,provisionalDrainageDecision:'keep'}:item),sanitary.id),undefined);
  assert.equal(relatedProvisionalDrainage(all.filter(item=>item.id!==drainage.id),sanitary.id),undefined);
  assert.equal(relatedProvisionalDrainage(all,'missing'),undefined);
  assert.equal(drainageHasEnteredData({...drainage,measurements:[{...drainage.measurements[0],expressions:{length:'=2+3'}}]}),true);
});
