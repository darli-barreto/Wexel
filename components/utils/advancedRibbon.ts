import { commitEdit } from "./excelEditing";
import type { Editor } from "@tiptap/react";
import { DOMSerializer, type Mark, type Node as PMNode } from "@tiptap/pm/model";
import { useWexelStore, type CellData } from "@/store/useWexelStore";
import { useWordEditorStore } from "@/store/useWordEditorStore";
import { processFormula } from "./excel";
import { clearCellFormatting } from "./cellFormatting";
import { activeAddress, editCell } from "./useRibbon";
export type AdvancedTool = 'paste'|'cut'|'copy'|'paint'|'effects'|'multilevel'|'sort'|'marks'|'spacing'|'borders'|'styles';
let copiedFormat: {marks: readonly Mark[]; attrs: Record<string, unknown>} | CellData | null = null;
let copiedFrom: 'word'|'excel' = 'word';
export async function advancedAction(tool: AdvancedTool, value = ''): Promise<string> {
 if(useWexelStore.getState().activeFocus==="excel")commitEdit();
 const state=useWexelStore.getState(), editor=useWordEditorStore.getState().editor;
 const excel=state.activeFocus==='excel';
 const sheet=state.sheets.find(s=>s.id===state.activeSheetId)!;
 const cell=sheet.cells[activeAddress(sheet)] ?? {rawValue:'',displayValue:'',dependencies:[]};
 if(tool==='copy'||tool==='cut') {
  if(excel) { await navigator.clipboard.writeText(cell.rawValue); if(tool==='cut')writeCellText(''); }
  else if(editor) {
   const {from,to}=editor.state.selection;if(from===to)return 'Selecciona el texto que deseas copiar.';
   const selection=editor.state.selection.content();const div=document.createElement('div');div.append(DOMSerializer.fromSchema(editor.schema).serializeFragment(selection.content));
   await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([div.innerHTML],{type:'text/html'}),'text/plain':new Blob([editor.state.doc.textBetween(from,to,'\n')],{type:'text/plain'})})]);
   if(tool==='cut')editor.chain().focus().deleteSelection().run();
  }return '';
 }
 if(tool==='paste') {
  if(excel){const text=await navigator.clipboard.readText();writeCellText(text);}
  else if(editor){
   const items=await navigator.clipboard.read();let html='',plain='';for(const item of items){if(item.types.includes('text/html'))html=await (await item.getType('text/html')).text();if(item.types.includes('text/plain'))plain=await (await item.getType('text/plain')).text();}
   if(html && value!=='plain')editor.chain().focus().insertContent(html).run();
   else editor.chain().focus().insertContent(plain.split(/\r?\n/).map(text=>({type:'paragraph',content:text?[{type:'text',text}]:[]}))).run();
  }return '';
 }
 if(tool==='paint') {
  if(value==='capture'){copiedFrom=state.activeFocus;copiedFormat=excel?{...cell}:editor?selectedWordFormat(editor):null;return 'Formato copiado. Selecciona el destino y elige Aplicar formato.';}
  if(!copiedFormat||copiedFrom!==state.activeFocus)return 'Primero copia un formato del mismo lienzo.';
  if(excel && 'rawValue' in copiedFormat){const {rawValue,displayValue,formula,dependencies,...format}=copiedFormat;void rawValue;void displayValue;void formula;void dependencies;editCell(c=>({...clearCellFormatting(c),...format}));}
  else if(editor && 'marks' in copiedFormat){let chain=editor.chain().focus().unsetAllMarks();for(const mark of copiedFormat.marks)chain=chain.setMark(mark.type.name,mark.attrs);chain.updateAttributes(editor.isActive('heading')?'heading':'paragraph',copiedFormat.attrs).run();}return '';
 }
 if(tool==='effects'){if(excel)editCell(c=>({...c,textEffect:value as CellData['textEffect']}));else editor?.chain().focus().setMark('textStyle',{textEffect:value}).run();return '';}
 if(tool==='borders'){if(excel)editCell(c=>({...c,borderStyle:value as CellData['borderStyle']}));else editor?.chain().focus().updateAttributes('paragraph',{borderStyle:value}).updateAttributes('heading',{borderStyle:value}).run();return '';}
 if(tool==='spacing'){if(excel)editCell(c=>({...c,lineHeight:Number(value)}));else editor?.chain().focus().updateAttributes('paragraph',{lineHeight:value}).updateAttributes('heading',{lineHeight:value}).run();return '';}
 if(excel)return 'Esta herramienta se aplica al documento de Word. Haz clic en el documento primero.';
 if(!editor)return '';
 if(tool==='multilevel') {if(value==='start')editor.chain().focus().toggleOrderedList().run();else if(value==='in') {if(!editor.chain().focus().sinkListItem('listItem').run())return 'Para crear un subnivel, selecciona un elemento después del primero.';}else editor.chain().focus().liftListItem('listItem').run();}
 if(tool==='marks'){useWordEditorStore.getState().toggleMarks();return '';}
 if(tool==='styles') {
  const chain=editor.chain().focus().unsetAllMarks();
  if(value==='normal'||value==='compact')chain.setParagraph().updateAttributes('paragraph',{spaceAfter:value==='compact'?'0px':'8px',lineHeight:value==='compact'?'1':'1.5'}).run();
  else chain.setHeading({level:value==='heading2'?2:1}).setFontSize(value==='title'?'28pt':value==='heading1'?'20pt':'16pt').setColor(value==='title'?'#171717':'#5f9dce').run();
 }
 if(tool==='sort') {
  const {from,to,$from}=editor.state.selection;const depth=$from.sharedDepth(to);const parent=$from.node(depth);const start=depth===0?0:$from.start(depth);const nodes:{node:PMNode,pos:number}[]=[];
  parent.forEach((node,offset)=>{const pos=start+offset;if(pos+node.nodeSize>from&&pos<to)nodes.push({node,pos});});
  if(nodes.length<2||nodes.some(n=>!['paragraph','heading','listItem'].includes(n.node.type.name)))return 'Selecciona al menos dos párrafos o elementos de la misma lista.';
  const sorted=[...nodes].sort((a,b)=>a.node.textContent.localeCompare(b.node.textContent,'es',{numeric:true})*(value==='desc'?-1:1));
  editor.chain().focus().command(({tr})=>{tr.replaceWith(nodes[0].pos,nodes[nodes.length-1].pos+nodes[nodes.length-1].node.nodeSize,sorted.map(n=>n.node));return true;}).run();
 }
 return '';
}

function writeCellText(text: string) {
 editCell(c=>({...c,rawValue:text,displayValue:text,formula:text.startsWith('=')?text:undefined,dependencies:[]}));
 const state=useWexelStore.getState();
 state.updateSheet(state.activeSheetId,sheet=>{
  const rows=Array.from({length:99},(_,i)=>String(i+1));const cols=Array.from({length:26},(_,i)=>String.fromCharCode(65+i));
  const matrix=rows.map(r=>cols.map(c=>sheet.cells[c+r] ?? {rawValue:'',displayValue:'',dependencies:[]}));
  const cells={...sheet.cells};
  for(let r=0;r<rows.length;r++)for(let c=0;c<cols.length;c++)if(matrix[r][c].formula){const result=processFormula(matrix[r][c].rawValue,matrix,rows,cols);matrix[r][c]={...matrix[r][c],...result};cells[cols[c]+rows[r]]=matrix[r][c];}
  return {...sheet,cells,formulaInput:text};
 });
}

function selectedWordFormat(editor: Editor) {
 const {from,to,$from}=editor.state.selection;
 let marks=editor.state.storedMarks ?? $from.marks();
 let attrs: Record<string,unknown>={...$from.parent.attrs};
 let foundText=false,foundBlock=false;
 editor.state.doc.nodesBetween(from,to,node=>{
  if(node.isTextblock&&!foundBlock){attrs={...node.attrs};foundBlock=true;}
  if(node.isText&&!foundText){marks=node.marks;foundText=true;}
 });
 return {marks,attrs};
}
