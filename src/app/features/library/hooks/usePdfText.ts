import {useState} from 'react';
import type {Book} from '../models/library';
export function usePdfText(book:Book){return useState({pages:book.pages??[],loading:false,progress:1})[0];}
