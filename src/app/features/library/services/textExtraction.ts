import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type {ContentBlock,ContentBlockKind,ContentPage} from '../models/library';

export type PdfTextItem={str?:string;transform?:number[];width?:number;height?:number;fontName?:string;hasEOL?:boolean};
type Line={items:PdfTextItem[];y:number;x:number;height:number};

GlobalWorkerOptions.workerSrc=workerSrc;

const textOf=(items:PdfTextItem[])=>items.map((item,index)=>{const prev=items[index-1];const gap=prev&&item.transform&&prev.transform?item.transform[4]-(prev.transform[4]+(prev.width??0)):0;return `${index&&gap>Math.max(2,(item.height??10)*.18)?' ':''}${item.str??''}`}).join('').replace(/\s+/g,' ').trim();
function linesFor(items:PdfTextItem[]):Line[]{const lines:Line[]=[];for(const item of items.filter(x=>x.str?.trim())){const t=item.transform??[1,0,0,1,0,0],x=t[4]??0,y=t[5]??0,h=Math.abs(t[3]??item.height??10)||10;let line=lines.find(l=>Math.abs(l.y-y)<=Math.max(2,h*.45));if(!line){line={items:[],y,x,height:h};lines.push(line)}line.items.push(item);line.x=Math.min(line.x,x);line.height=Math.max(line.height,h)}return lines.sort((a,b)=>b.y-a.y).map(line=>({...line,items:line.items.sort((a,b)=>(a.transform?.[4]??0)-(b.transform?.[4]??0))}))}
function classify(text:string,line:Line,median:number):ContentBlockKind{const words=text.split(/\s+/).length, bold=line.items.some(i=>/bold|black|semibold/i.test(i.fontName??'')), size=line.height/median;if(/^([-*•▪]|\d+[.)])\s/.test(text))return 'list-item';if(line.x>median*2)return 'quote';if(words<=12&&(size>1.35||bold))return size>1.65?'title':'heading';if(words<=10&&size>1.12)return 'subtitle';if(/^[A-ZÁÉÍÓÚÑ][^.!?]{1,45}:$/.test(text))return 'label';return 'paragraph'}
export function formatPdfPage(items:PdfTextItem[]):ContentPage{const lines=linesFor(items);if(!lines.length)return {blocks:[]};const median=lines.slice().sort((a,b)=>a.height-b.height)[Math.floor(lines.length/2)].height;const blocks:ContentBlock[]=[];for(const line of lines){const text=textOf(line.items);if(!text)continue;const previous=blocks.at(-1);const gap=previous?Math.abs(line.y-(lines[lines.indexOf(line)-1]?.y??line.y)):99;const kind=classify(text,line,median);if(previous&&previous.kind==='paragraph'&&kind==='paragraph'&&gap<line.height*1.8){previous.text=previous.text.replace(/-$/,'')+(previous.text.endsWith('-')?'':' ')+text;previous.lines=(previous.lines??1)+1}else blocks.push({kind,text,style:{fontSize:line.height,bold:line.items.some(i=>/bold|black|semibold/i.test(i.fontName??'')),indent:line.x},lines:1})}return {blocks}}

export function normalizePageText(items:Array<{str?:string}>):string{return textOf(items)}

export async function extractPdfText(blob:Blob,onProgress?:(completed:number,total:number)=>void,signal?:AbortSignal):Promise<ContentPage[]>{
  const pdf=await getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise; const pages:ContentPage[]=[];
  try { for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){ if(signal?.aborted)throw new DOMException('Aborted','AbortError'); const page=await pdf.getPage(pageNumber); const content=await page.getTextContent(); pages.push(formatPdfPage(content.items as PdfTextItem[])); onProgress?.(pageNumber,pdf.numPages); page.cleanup(); } return pages; }
 finally {await pdf.destroy();}
}
