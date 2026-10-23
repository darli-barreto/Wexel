const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache=new Map();
module.exports=function load(file){
  file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file).exports;
  const mod={exports:{}};cache.set(file,mod);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const requireLocal=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)+(id.endsWith('.json')?'':'.ts')):require(id);
  vm.runInThisContext('(function(exports,require,module){'+code+'\n})',{filename:file})(mod.exports,requireLocal,mod);
  return mod.exports;
};
