import { Header, Footer, Paragraph, TextRun, ImageRun, PageNumber } from 'docx';
import type { PageBand } from '@/store/useWexelStore';
async function bandParagraph(band: PageBand | undefined, footer: boolean) {
 const children: (TextRun | ImageRun)[]=[];
 if(band?.logo){
  const image=new Image();image.src=band.logo;await image.decode();
  const scale=Math.min(100/image.naturalWidth,40/image.naturalHeight,1);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);
  const binary=atob(canvas.toDataURL('image/png').split(',')[1]);
  children.push(new ImageRun({type:'png',data:Uint8Array.from(binary,c=>c.charCodeAt(0)),transformation:{width:canvas.width,height:canvas.height}}));
  children.push(new TextRun('  '));
 }
 children.push(new TextRun(band?.text ?? ''));
 if(footer)children.push(new TextRun({children:['  ·  Página ',PageNumber.CURRENT]}));
 return new Paragraph({children});
}
export async function pageBandsDocx(header?: PageBand, footer?: PageBand) {
 return {headers:{default:new Header({children:[await bandParagraph(header,false)]})},footers:{default:new Footer({children:[await bandParagraph(footer,true)]})}};
}
