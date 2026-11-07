import {useEffect,useRef,useState} from 'react';
import type {Book,ContentPage} from '../../models/library';
import {db} from '../../services/libraryDb';
import {IconBookmark,IconBookmarkFilled,IconMoon,IconSettings,IconSun,IconX} from '@tabler/icons-react';

export function Reader({book,onClose,onDelete}:{book:Book;onClose:()=>void;onDelete?:()=>void}) {
  const [pages,setPages]=useState<string[]|undefined>(book.pages?.filter(Boolean));
  const [blocks,setBlocks]=useState<ContentPage[]|undefined>();
  const [page,setPage]=useState(book.page||1);
  const [fontSize,setFontSize]=useState(book.fontSize||18);
  const [theme,setTheme]=useState(book.theme||'light');
  const [lineHeight,setLineHeight]=useState(book.lineHeight||1.7);
  const [readingWidth,setReadingWidth]=useState<Book['readingWidth']>(book.readingWidth||'narrow');
  const [bookmarkPage,setBookmarkPage]=useState(book.bookmarkPage??null);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const settingsRef=useRef<HTMLDialogElement>(null);
  const persist=(changes:Partial<Book>)=>{void db.books.update(book.id,changes);};
  useEffect(()=>{if(pages?.length)return; void db.extractedText.get(book.id).then(text=>{if(text?.blocks?.length)setBlocks(text.blocks);else if(text?.pages?.length)setPages(text.pages);});},[book.id,pages?.length]);
  useEffect(()=>{if(settingsOpen)settingsRef.current?.focus();},[settingsOpen]);
  const total=blocks?.length||pages?.length||0; const current=Math.min(page,total||1);
  const toggleBookmark=()=>{const next=bookmarkPage===current?null:current;setBookmarkPage(next);persist({bookmarkPage:next});};
  const changePage=(next:number)=>{setPage(next);persist({page:next});};
  if(!total)return <div className="reader"><header><button onClick={onClose} aria-label="Cerrar lector"><IconX/></button><strong>{book.name}</strong></header><main><section role="status" aria-live="polite"><h2>Este libro debe importarse nuevamente</h2><p>No se encontró el texto guardado de este libro.</p><button onClick={onClose}>Volver a la biblioteca</button>{onDelete&&<button onClick={onDelete}>Eliminar registro</button>}</section></main></div>;
  return <div className={`reader reader-${theme}`}>
    <header><button onClick={onClose} aria-label="Cerrar lector"><IconX/></button><strong>{book.name}</strong><span>{current} / {total}</span></header>
    <main><article className={`reading-page reading-${readingWidth}`} style={{fontSize,lineHeight}}>{blocks?blocks[current-1].blocks.map((block,i)=>{const Tag=block.kind==='title'||block.kind==='heading'?'h2':block.kind==='subtitle'?'h3':block.kind==='quote'?'blockquote':block.kind==='list-item'?'li':'p';return <Tag key={i} className={`content-${block.kind}`}>{block.text}</Tag>}):pages![current-1].split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</article></main>
    <footer className="reader-pagination"><button disabled={current<=1} onClick={()=>changePage(current-1)}>Anterior</button><button disabled={current>=total} onClick={()=>changePage(current+1)}>Siguiente</button></footer>
    <nav className="reader-toolbar" aria-label="Controles del lector">
      <div className="reader-control-group"><button aria-label="Reducir tamaño de texto" onClick={()=>{const next=Math.max(14,fontSize-1);setFontSize(next);persist({fontSize:next});}}><span aria-hidden="true">A−</span></button><span aria-label={`Tamaño de texto ${fontSize}`}>A</span><button aria-label="Aumentar tamaño de texto" onClick={()=>{const next=Math.min(30,fontSize+1);setFontSize(next);persist({fontSize:next});}}><span aria-hidden="true">A+</span></button></div>
      <button aria-label={theme==='light'?'Cambiar a tema oscuro':'Cambiar a tema claro'} onClick={()=>{const next=theme==='light'?'dark':'light';setTheme(next);persist({theme:next});}}>{theme==='light'?<IconMoon/>:<IconSun/>}<span>Brillo</span></button>
      <button aria-pressed={bookmarkPage===current} className={bookmarkPage===current?'is-active':''} onClick={toggleBookmark}><>{bookmarkPage===current?<IconBookmarkFilled/>:<IconBookmark/>}</><span>Marcar</span></button>
      <button onClick={()=>setSettingsOpen(true)}><IconSettings/><span>Ajustes</span></button>
    </nav>
    {settingsOpen&&<dialog open ref={settingsRef} className="reader-settings" aria-labelledby="reader-settings-title" onKeyDown={event=>{if(event.key==='Escape')setSettingsOpen(false);}}><div className="settings-heading"><h2 id="reader-settings-title">Ajustes de lectura</h2><button onClick={()=>setSettingsOpen(false)} aria-label="Cerrar ajustes"><IconX/></button></div><label>Interlineado<select value={lineHeight} onChange={event=>{const next=Number(event.target.value);setLineHeight(next);persist({lineHeight:next});}}><option value="1.4">Compacto</option><option value="1.7">Cómodo</option><option value="2">Amplio</option></select></label><label>Ancho de lectura<select value={readingWidth} onChange={event=>{const next=event.target.value as Book['readingWidth'];setReadingWidth(next);persist({readingWidth:next});}}><option value="narrow">Estrecho</option><option value="wide">Ancho</option></select></label></dialog>}
  </div>;
}
