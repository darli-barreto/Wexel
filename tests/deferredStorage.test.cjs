const test=require('node:test'),assert=require('node:assert/strict');
const {deferredStorage}=require('./loadTypeScript.cjs')('store/deferredStorage.ts');

test('tab navigation persists separately without rewriting the workbook payload',()=>{
  const original=global.localStorage, data=new Map(),writes=[];
  global.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push({key,value});data.set(key,value);},removeItem:key=>data.delete(key)};
  const storage=deferredStorage(s=>[s.revision],s=>({view:s.view}));
  try {
    storage.setItem('tabs',{state:{revision:1,view:'metrado',cells:{G3:'=2*3'}},version:1});
    writes.length=0;
    for(const view of ['acero','resumen','metrado','acero']) storage.setItem('tabs',{state:{revision:1,view,cells:{G3:'=2*3'}},version:1});
    assert.equal(writes.length,4);
    assert.ok(writes.every(w=>w.key==='tabs:navigation' && !w.value.includes('cells')));
    assert.deepEqual(storage.getItem('tabs').state,{revision:1,view:'acero',cells:{G3:'=2*3'}});
    storage.removeItem('tabs');assert.equal(data.size,0);
  } finally {global.localStorage=original;}
});
test('storage batches durable edits, skips selection writes, and flushes on pagehide or visibility loss',()=>{
  const original={window:global.window,document:global.document,localStorage:global.localStorage};
  const listeners=new Map(),data=new Map(),writes=[];
  global.window={addEventListener:(event,fn)=>listeners.set(event,fn)};
  global.document={visibilityState:'visible',addEventListener:(event,fn)=>listeners.set(event,fn)};
  global.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push(value);data.set(key,value);},removeItem:key=>data.delete(key)};
  const storage=deferredStorage(state=>[state.revision]);
  try{
    storage.setItem('test',{state:{revision:1,cell:'A1'},version:1});
    storage.setItem('test',{state:{revision:1,cell:'B1'},version:1});
    storage.setItem('test',{state:{revision:2,cell:'B1',value:'=1+2'},version:1});
    assert.equal(writes.length,0);
    listeners.get('pagehide')();
    assert.equal(writes.length,1);assert.equal(JSON.parse(writes[0]).state.value,'=1+2');
    storage.setItem('test',{state:{revision:2,cell:'C1'},version:1});listeners.get('pagehide')();assert.equal(writes.length,1);
    storage.setItem('test',{state:{revision:3,value:'123'},version:1});
    global.document.visibilityState='hidden';listeners.get('visibilitychange')();assert.equal(writes.length,2);
    assert.equal(storage.getItem('test').state.value,'123');
  }finally{storage.removeItem('test');Object.assign(global,original);}
});
