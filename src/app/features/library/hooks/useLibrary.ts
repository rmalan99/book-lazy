import {useLiveQuery} from 'dexie-react-hooks'; import {db} from '../services/libraryDb'; export function useLibrary(){return useLiveQuery(()=>db.books.orderBy('addedAt').reverse().toArray(),[],[]);}
