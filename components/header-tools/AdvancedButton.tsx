"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useWordEditorStore } from '@/store/useWordEditorStore';
import { createPortal } from 'react-dom';
import { advancedAction, type AdvancedTool } from '../utils/advancedRibbon';
const options: Partial<Record<AdvancedTool, [string,string][]>> = {
 paste:[['Pegar conservando formato',''],['Pegar solo texto','plain']],
 paint:[['Copiar formato','capture'],['Aplicar formato','apply']],
 effects:[['Sin efecto','none'],['Sombra','shadow'],['Contorno','outline'],['Resplandor','glow']],
 multilevel:[['Crear lista numerada','start'],['Aumentar nivel','in'],['Reducir nivel','out']],
 sort:[['Ordenar párrafos A → Z','asc'],['Ordenar párrafos Z → A','desc']],
 spacing:[['Interlineado 1','1'],['Interlineado 1,15','1.15'],['Interlineado 1,5','1.5'],['Interlineado 2','2'],['Interlineado 2,5','2.5']],
 borders:[['Sin bordes','none'],['Todos los bordes','all'],['Borde inferior','bottom']],
 styles:[['Normal','normal'],['Sin espaciado','compact'],['Título','title'],['Encabezado 1','heading1'],['Encabezado 2','heading2']],
};
export default function AdvancedButton({tool,label,children,className='',value}: {tool:AdvancedTool;label:string;children:ReactNode;className?:string;value?:string}) {
 const ref=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState<{left:number;top:number}|null>(null);const [message,setMessage]=useState('');const pressed=useWordEditorStore(s=>s.showMarks);
 useEffect(()=>{if(!position)return;const close=(e:Event)=>{if(!panel.current?.contains(e.target as Node)&&!ref.current?.contains(e.target as Node))setPosition(null);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPosition(null);ref.current?.focus();}};document.addEventListener('mousedown',close);document.addEventListener('keydown',key);window.addEventListener('resize',close);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',key);window.removeEventListener('resize',close);};},[position]);
 const run=async(v='')=>{setPosition(null);try{setMessage(await advancedAction(tool,v));}catch{setMessage('No se pudo acceder al portapapeles. Usa Ctrl+C, Ctrl+X o Ctrl+V en el lienzo.');}};
 return <><button ref={ref} type="button" aria-label={label} title={label} aria-pressed={tool==='marks'?pressed:undefined} aria-expanded={options[tool]&&value===undefined?Boolean(position):undefined} className={className} onMouseDown={e=>e.preventDefault()} onClick={()=>{
 if(!options[tool]||value!==undefined){void run(value);return;}const rect=ref.current!.getBoundingClientRect();setPosition(position?null:{left:Math.max(8,Math.min(rect.left,window.innerWidth-240)),top:rect.bottom+6});
 }}>{children}</button>{position&&createPortal(<div ref={panel} role="menu" aria-label={label} style={{position:'fixed',...position,zIndex:1000}} className="w-56 rounded border border-gray-300 bg-white py-1 shadow-lg text-sm text-gray-800">{options[tool]?.map(([text,v])=><button role="menuitem" className="block w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100" key={v} onMouseDown={e=>e.preventDefault()} onClick={()=>void run(v)}>{text}</button>)}</div>,document.body)}{message&&createPortal(<div role="status" className="fixed bottom-10 left-4 z-[1001] max-w-sm rounded border bg-white p-3 text-sm shadow-lg">{message}<button className="ml-3 underline" onClick={()=>setMessage('')}>Cerrar</button></div>,document.body)}</>;
}
