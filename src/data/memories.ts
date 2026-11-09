export type MemorySide = 'left' | 'right';

export interface Memory {
  id: string;
  image: string;
  caption: string;
  detail: string;
  side: MemorySide;
  rotation: number;
}

const placeholderImage = '/assets/memories/photo-placeholder.svg';

export const memories: Memory[] = [
  { id: '1', image: placeholderImage, caption: 'Caption foto 01', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: -2 },
  { id: '2', image: placeholderImage, caption: 'Caption foto 02', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: 1.5 },
  { id: '3', image: placeholderImage, caption: 'Caption foto 03', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: 2 },
  { id: '4', image: placeholderImage, caption: 'Caption foto 04', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: -1.5 },
  { id: '5', image: placeholderImage, caption: 'Caption foto 05', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: -1 },
  { id: '6', image: placeholderImage, caption: 'Caption foto 06', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: 2 },
  { id: '7', image: placeholderImage, caption: 'Caption foto 07', detail: 'Tambahkan detail foto di sini.', side: 'left', rotation: 1.5 },
  { id: '8', image: placeholderImage, caption: 'Caption foto 08', detail: 'Tambahkan detail foto di sini.', side: 'right', rotation: -2 },
];
