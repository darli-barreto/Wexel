// Executed through Figma MCP with `spec` loaded from design/metrados-icons.json.
const page = await figma.getNodeByIdAsync('0:1');
await figma.setCurrentPageAsync(page);
const existing = page.children.find(node => node.name === 'Metrados · Iconos Wexel');
if (existing) return { existing: existing.id, message: 'La familia ya existe; continuar desde su registro de nodos.' };

const hex = value => ({ r: parseInt(value.slice(1,3),16)/255, g: parseInt(value.slice(3,5),16)/255, b: parseInt(value.slice(5,7),16)/255 });
const paint = value => ({ type: 'SOLID', color: hex(value) });
const created = [], mutated = [];
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const collection = collections.find(c => c.name === 'Wexel · Iconos') ?? figma.variables.createVariableCollection('Wexel · Iconos');
const variables = await figma.variables.getLocalVariablesAsync();
const tokens = {};
for (const [name,value,css,primitiveCss] of [
  ['stroke',spec.stroke,'--wexel-icon-stroke','--wexel-secondary'],
  ['muted',spec.muted,'--wexel-icon-muted','--wexel-primary'],
  ['accent',spec.accent,'--wexel-icon-accent','--wexel-icon-accent']
]) {
  const primitive = variables.find(v => v.variableCollectionId === collection.id && v.name === 'palette/'+name) ?? figma.variables.createVariable('palette/'+name,collection,'COLOR');
  primitive.scopes = []; primitive.setValueForMode(collection.defaultModeId,hex(value)); primitive.setVariableCodeSyntax('WEB','var('+primitiveCss+')');
  const semantic = variables.find(v => v.variableCollectionId === collection.id && v.name === 'icon/'+name) ?? figma.variables.createVariable('icon/'+name,collection,'COLOR');
  semantic.scopes = ['SHAPE_FILL','STROKE_COLOR']; semantic.setValueForMode(collection.defaultModeId,{ type:'VARIABLE_ALIAS',id:primitive.id }); semantic.setVariableCodeSyntax('WEB','var('+css+')');
  tokens[name] = semantic;
}
await Promise.all(['Regular','Medium','Semi Bold'].map(style => figma.loadFontAsync({family:'Inter',style})));
const rightEdge = Math.max(...page.children.map(n => n.x+n.width));
function auto(name,direction,parent,width) {
  const node = figma.createAutoLayout(direction); node.name = name; created.push(node.id);
  parent.appendChild(node); node.fills = []; node.resize(width,1); node.primaryAxisSizingMode=direction==='HORIZONTAL'?'FIXED':'AUTO'; node.counterAxisSizingMode=direction==='HORIZONTAL'?'AUTO':'FIXED'; return node;
}
function text(parent,characters,size,style='Regular',width=776) {
  const node=figma.createText(); created.push(node.id); node.fontName={family:'Inter',style}; node.characters=characters; node.fontSize=size; node.fills=[paint(spec.stroke)];
  parent.appendChild(node); node.textAutoResize='HEIGHT'; node.resize(width,node.height); node.layoutSizingHorizontal='FIXED'; node.layoutSizingVertical='HUG'; return node;
}
const masters = auto('Metrados · Componentes de iconos','VERTICAL',page,776);
masters.x=rightEdge+120; masters.y=640; masters.itemSpacing=28;
const components=[];
for (let index=0;index<spec.icons.length;index++) {
  if(index%7===0) var masterRow=auto('Componentes '+(Math.floor(index/7)+1),'HORIZONTAL',masters,776);
  masterRow.itemSpacing=40;
  const icon=spec.icons[index]; let component;
  if(icon.sourceNode) {
    const source=await figma.getNodeByIdAsync(icon.sourceNode);
    // Export cached glyph outlines instead of replacing an unavailable original font.
    const clone=source.findAllWithCriteria({types:['TEXT']}).length
      ? figma.createNodeFromSvg(await source.exportAsync({format:'SVG_STRING',svgOutlineText:true})) : source.clone();
    created.push(clone.id);
    masterRow.appendChild(clone); clone.fills=[]; component=figma.createComponentFromNode(clone);
  } else {
    const frame=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="'+spec.stroke+'" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter">'+icon.body+'</svg>');
    masterRow.appendChild(frame); created.push(frame.id); component=figma.createComponentFromNode(frame);
  }
  created.push(component.id); component.name='Metrados / '+icon.name; component.description=icon.label+'. Icono de 16 px para la cinta Metrados. '+(icon.sourceNode?'Geometría original de ARM Structural, nodo '+icon.sourceNode+'.':'Extensión del estilo ARM Structural: trazo 1 px, grafito y celeste.');
  component.exportSettings=[{format:'SVG',svgOutlineText:true,svgIdAttribute:false,svgSimplifyStroke:true}];
  for(const node of [component,...component.findAll()]) {
    for(const property of ['fills','strokes']) if(property in node && Array.isArray(node[property])) {
      node[property]=node[property].map(p=>{
        if(p.type!=='SOLID') return p;
        const key=Object.keys(tokens).find(key => {const c=hex(spec[key]);return Math.abs(c.r-p.color.r)<.005&&Math.abs(c.g-p.color.g)<.005&&Math.abs(c.b-p.color.b)<.005;});
        return key?figma.variables.setBoundVariableForPaint(p,'color',tokens[key]):p;
      });
    }
  }
  components.push({name:icon.name,label:icon.label,id:component.id,width:component.width,height:component.height,sourceNode:icon.sourceNode??null});
}
const board=auto('Metrados · Iconos Wexel','VERTICAL',page,840); board.x=rightEdge+120;board.y=0;board.paddingTop=32;board.paddingBottom=32;board.paddingLeft=32;board.paddingRight=32;board.itemSpacing=20;board.fills=[paint('#FFFFFF')];
text(board,'Iconos · Metrados',26,'Semi Bold');
text(board,'ARM Structural / Wexel · 28 iconos · 16 × 16 px',12);
text(board,'Trazo fino 1 px  ·  Grafito #444444  ·  Celeste #6DB3DE',11);
const rows=[];
for(let index=0;index<components.length;index++) {
  if(index%7===0) { var row=auto('Cinta · fila '+(Math.floor(index/7)+1),'HORIZONTAL',board,776);row.itemSpacing=8;rows.push(row.id); }
  const card=auto(components[index].label,'VERTICAL',row,104); card.paddingTop=14;card.paddingBottom=12;card.paddingLeft=4;card.paddingRight=4;card.itemSpacing=8;card.counterAxisAlignItems='CENTER'; card.fills=[paint('#E8E8E8')];
  const master=await figma.getNodeByIdAsync(components[index].id);const instance=master.createInstance();created.push(instance.id);card.appendChild(instance);
  const caption=text(card,components[index].label,10,'Regular',96);caption.textAlignHorizontal='CENTER';
  card.resize(104,76); card.primaryAxisSizingMode='FIXED';
}
text(board,'Los originales permanecen en «Icons». Cada muestra es una instancia editable.',11);
return {fileKey:spec.fileKey,boardId:board.id,mastersId:masters.id,rowIds:rows,components,collectionId:collection.id,variableIds:Object.values(tokens).map(v=>v.id),createdNodeIds:created,mutatedNodeIds:mutated,boardBounds:{x:board.x,y:board.y,width:board.width,height:board.height}};
