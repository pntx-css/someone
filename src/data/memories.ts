import pict1 from '../assets/pict1.webp';
import pict2 from '../assets/pict2.webp';
import pict3 from '../assets/pict3.webp';
import pict4 from '../assets/pict4.webp';
import pict5 from '../assets/pict5.webp';
import pict6 from '../assets/pict6.webp';
import pict7 from '../assets/pict7.webp';
import pict8 from '../assets/pict8.webp';
import pict9 from '../assets/pict9.webp';
import pict10 from '../assets/pict10.webp';
import pict11 from '../assets/pict11.webp';
import pict12 from '../assets/pict12.webp';
import pict13 from '../assets/pict13.webp';

export type MemorySide = 'left' | 'right';

export interface Memory {
  id: string;
  image: string;
  width: number;
  height: number;
  caption: string;
  detail: string;
  side: MemorySide;
  rotation: number;
}

export const memories: Memory[] = [
  { id: '1', image: pict1, width: 4000, height: 2250, caption: 'Caption foto 01', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: -2 },
  { id: '2', image: pict2, width: 2992, height: 2992, caption: 'Caption foto 02', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: 1.5 },
  { id: '3', image: pict3, width: 2448, height: 2448, caption: 'Caption foto 03', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: 2 },
  { id: '4', image: pict4, width: 3000, height: 4000, caption: 'Caption foto 04', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: -1.5 },
  { id: '5', image: pict5, width: 3000, height: 4000, caption: 'Caption foto 05', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: -1 },
  { id: '6', image: pict6, width: 3000, height: 4000, caption: 'Caption foto 06', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: 2 },
  { id: '7', image: pict7, width: 4000, height: 2250, caption: 'Caption foto 07', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: 1.5 },
  { id: '8', image: pict8, width: 3000, height: 4000, caption: 'Caption foto 08', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: -2 },
  { id: '9', image: pict9, width: 3000, height: 4000, caption: 'Caption foto 09', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: -1 },
  { id: '10', image: pict10, width: 4000, height: 3000, caption: 'Caption foto 10', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: 2 },
  { id: '11', image: pict11, width: 3000, height: 4000, caption: 'Caption foto 11', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: 1.5 },
  { id: '12', image: pict12, width: 960, height: 1280, caption: 'Caption foto 12', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: -2 },
  { id: '13', image: pict13, width: 1066, height: 600, caption: 'Caption foto 13', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: -1 },
];
