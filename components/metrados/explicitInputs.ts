import type {EstimateItem,MeasurementLine} from '../../store/useMetradoStore';
/** Restore persisted semantic templates and expose literal operands without guessing geometry. */
export function exposeProjectInputs(items:EstimateItem[]):EstimateItem[]{
 let changed=false;
 const next=items.map(item=>({...item,measurements:item.measurements.map(original=>{
  let line=original;
  const inputs=[...line.formulaInputs??[]],templates={...line.formulaTemplates};
  const pair=inputs.length===2&&inputs[0].id==='value0'&&inputs[1].id==='value1';
  if(pair&&line.crossSections?.method==='meanArea'&&inputs[0].label==='Ancho sección (m)'&&inputs[1].label==='Profundidad (m)'&&!line.formulaTemplateOverrides?.includes('meanArea'))templates.meanArea??='=@{value0}*@{value1}';
  if(pair&&line.columnSection&&inputs[0].label==='Base del área (m)'&&inputs[1].label==='Ancho del área (m)'&&!line.formulaTemplateOverrides?.includes('columnArea'))templates.columnArea??='=@{value0}*@{value1}';
  if(/^qa-measure:\d+$/.test(line.id)&&/^=PRODUCT\(F(\d+):K\1\)$/i.test(line.resultRaw??'')&&!templates.result)templates.result='=PRODUCT(F@row:K@row)';
  if(line.surplus?.manual&&line.surplus.sourceItemIds?.length&&/Excel base.*Volumen vinculado al origen/i.test(line.swelling?.support??'')&&/^=SUM\(P\d+\)$/i.test(line.expressions?.length??''))line={...line,surplus:{...line.surplus,manual:false},calculationError:undefined};
  const fields:Record<string,string|undefined>={...line.expressions,columnArea:line.columnSection?.areaExpression,buriedHeight:line.columnSection?.heightExpression,...line.crossSections?.expressions,result:line.resultRaw};
  for(const [field,expression] of Object.entries(fields)){
   if(templates[field]||!expression?.startsWith('=')||!/[+*/^-]/.test(expression.slice(1))||/[A-Z]+\d/i.test(expression))continue;
   let count=0;
   const template=expression.replace(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi,value=>{const id=field+'Value'+count++;inputs.push({id,label:({columnArea:'Área',meanArea:'Sección',length:'Largo',width:'Ancho',height:'Altura',result:'Resultado'} as Record<string,string>)[field]+' · '+count,value});return '@{'+id+'}';});
   if(count)templates[field]=template;
  }
  if(line.swelling&&!line.surplus&&!inputs.some(input=>input.id==='swelling'))inputs.push({id:'swelling',label:'Factor volumen',value:String(line.swelling.factor)});
  if(inputs.length||Object.keys(templates).length){
   line={...line,formulaInputs:inputs,formulaTemplates:templates};
   // This specific generated formula lost its factor row when the feature was removed.
   if(inputs.some(i=>i.id==='swelling')&&line.resultRaw&&/^=F\d+\*G\d+\*H\d+\*I\d+\*J\d+\*G\d+$/.test(line.resultRaw))line={...line,resultRaw:undefined,quantityOverride:undefined};
  }
  if(JSON.stringify(line)!==JSON.stringify(original))changed=true;
  return line;
 })}));
 return changed?next:items;
}
export const fieldColumn=(line:MeasurementLine,field:string)=>({similarElements:'F',length:'G',manualQuantity:'G',width:'H',height:'I',repetitions:'J',columnArea:'H',buriedHeight:'G',initialArea:'H',finalArea:'I',meanArea:'H',swellingFactor:'H',result:({length:'K',area:'L',volume:'M',weight:'N',units:'O'} as const)[line.kind]} as Record<string,string>)[field];
