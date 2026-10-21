"use client";
import Image from "next/image";
import { useState } from "react";
import { useWexelStore } from "@/store/useWexelStore";
export default function PageBand({ band, page }: { band: "header" | "footer"; page: number }) {
 const value = useWexelStore(s => s.word[band]);
 const set = useWexelStore(s => s.setPageBand);
 const [error, setError] = useState("");
 const label = band === 'header' ? 'Encabezado' : 'Pie de página';
 return <div className="group flex items-center gap-3 text-xs text-gray-500" style={{position:'absolute', zIndex:5, left:80, right:80, top:band==='header'?20:undefined,bottom:band==='footer'?18:undefined,height:42,pointerEvents:'auto'}}>
  {value?.logo && <button title={'Quitar logo de '+label} onClick={()=>set(band,{text:value.text,logo:''})} className="shrink-0 cursor-pointer"><Image unoptimized width={100} height={40} src={value.logo} alt={'Logo de '+label} style={{maxWidth:100,maxHeight:40,objectFit:'contain'}} /></button>}
  <input aria-label={label+' página '+page} placeholder={label+' — escribe aquí'} value={value?.text ?? ''} onChange={e=>set(band,{text:e.target.value,logo:value?.logo ?? ''})} className="min-w-0 flex-1 bg-transparent outline-none border-b border-transparent focus:border-gray-300" />
  <label className="cursor-pointer opacity-0 group-hover:opacity-100 focus-within:opacity-100">Logo<input aria-label={'Logo de '+label+' página '+page} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{
   const file=e.target.files?.[0]; e.target.value=''; if(!file)return;
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>500000){setError('Usa PNG, JPG o WebP de hasta 500 KB.');return;}
   const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file);}).catch(()=>null);
   if(!data){setError('No se pudo leer la imagen.');return;}
   try { const image=new window.Image();image.src=data;await image.decode(); } catch { setError('El archivo no contiene una imagen válida.');return; }
   setError('');set(band,{text:useWexelStore.getState().word[band]?.text ?? '',logo:data});
  }}/></label>
  {band==='footer' && <span className="shrink-0">Página {page}</span>}
  {error && <span role="alert" className="text-red-600">{error}</span>}
 </div>;
}
