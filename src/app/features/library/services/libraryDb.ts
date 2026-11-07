import Dexie,{type Table} from 'dexie'; import type {Book,ExtractedText,NewBook} from '../models/library';
class LibraryDb extends Dexie {books!:Table<Book,number,NewBook>; extractedText!:Table<ExtractedText,number>;
  constructor(){super('bookpoor');this.version(1).stores({books:'++id, name, addedAt'});this.version(2).stores({books:'++id, name, addedAt',extractedText:'bookId'});this.version(3).stores({books:'++id, name, addedAt',extractedText:'bookId'}).upgrade(tx=>tx.table('books').toCollection().modify(book=>{delete (book as {blob?:Blob}).blob;}));this.version(4).stores({books:'++id, name, addedAt'});this.version(5).stores({books:'++id, name, addedAt',extractedText:'bookId'});}}
export const db=new LibraryDb();
