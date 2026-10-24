const test=require('node:test'),assert=require('node:assert/strict'),load=require('./loadTypeScript.cjs');
const {createNormaItems,withNormaDetails}=load('components/metrados/normaCatalog.ts');
const {surplusSources,addSurplusBalance}=load('components/metrados/surplusBalance.ts');
test('template balance remains idempotent, distinguishes borrow and retains deletions and user entries',()=>{
 const items=createNormaItems(['OE.2']),target=items.find(i=>i.norma.id==='OE.2.1.6');
 assert.equal(target.measurements.length,2);assert.ok(target.measurements.every(l=>l.surplus));
 const fill=target.measurements[1];assert.equal(fill.sign,-1);
 assert.ok(surplusSources(items,fill).every(i=>i.norma.code==='OE.2.1.4.1'));
 assert.ok(surplusSources(items,target.measurements[0]).length>=2);
 const deleted={...target,measurements:[target.measurements[0]]};
 assert.equal(withNormaDetails([deleted])[0].measurements.length,1);
 assert.equal(addSurplusBalance(target),target);
 const edited={...target,surplusTemplateVersion:undefined,measurements:[{...target.measurements[0],description:'Mi retiro',surplus:undefined,length:12}]};
 assert.equal(withNormaDetails([edited])[0],edited);
 const otherScope={...items.find(i=>i.norma.id==='OE.2.1.4.1'),id:'other-scope',parentId:'different-scope'};
 assert.ok(!surplusSources([...items,otherScope],fill).some(i=>i.id==='other-scope'));
});
