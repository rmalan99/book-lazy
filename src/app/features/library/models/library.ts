export type ContentBlockKind='heading'|'title'|'subtitle'|'paragraph'|'quote'|'list-item'|'label';
export type ContentBlock={kind:ContentBlockKind;text:string;style?:{fontSize?:number;bold?:boolean;indent?:number;align?:'left'|'center'|'right'};lines?:number};
export type ContentPage={blocks:ContentBlock[]};
export type Book={id:number;name:string;size:number;addedAt:number;pages?:string[]|null;progress:number;page:number;fontSize:number;lineHeight:number;readingWidth?:'narrow'|'wide';theme:'light'|'dark';bookmarkPage?:number|null};
export type NewBook=Omit<Book,'id'>;
export type ExtractedText={bookId:number;pages?:string[];blocks?:ContentPage[];updatedAt:number;format?:'blocks'};
export function isPdfFile(file:Pick<File,'type'|'name'>){return file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf');}
export async function preparePdfData(blob:Blob):Promise<Uint8Array>{return new Uint8Array(await blob.arrayBuffer());}
