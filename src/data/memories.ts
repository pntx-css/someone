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
  { id: '1', image: pict1, width: 4000, height: 2250, caption: 'Suki & Plenger People', detail: 'waktu pertama kali kita ketemuan dan main bareng.', side: 'left', rotation: -2 },
  { id: '2', image: pict2, width: 2992, height: 2992, caption: 'Kapel Gelang', detail: 'mwehehehe lucu, samaan, kapel, humhum.', side: 'right', rotation: 1.5 },
  { id: '3', image: pict3, width: 2448, height: 2448, caption: 'Mam Bareng', detail: 'wohohoho panik krna katanya ada kenalan mamah.', side: 'left', rotation: 2 },
  { id: '4', image: pict4, width: 3000, height: 4000, caption: 'Nasgor Goreng', detail: 'jauh-jauh muter-muter endingnya kesini. gapapa si, keliling solok.', side: 'right', rotation: -1.5 },
  { id: '5', image: pict5, width: 3000, height: 4000, caption: 'Paket Santet', detail: 'nobar bareng bersama pertama di bioskop.', side: 'left', rotation: -1 },
  { id: '6', image: pict6, width: 3000, height: 4000, caption: 'Gajadi Ke Bakso Worth It', detail: 'HAHAHAHAH, nashville nya ENAK tuh.', side: 'right', rotation: 2 },
  { id: '7', image: pict7, width: 4000, height: 2250, caption: 'Dempetan di KRL', detail: 'mwehehe nobar tiktok sama yt.', side: 'left', rotation: 1.5 },
  { id: '8', image: pict8, width: 3000, height: 4000, caption: 'Nescafe in Jogja', detail: 'baru sampe langsung ngopih lohya.', side: 'right', rotation: -2 },
  { id: '9', image: pict9, width: 3000, height: 4000, caption: 'Nasinya PULEN Tuh', detail: 'lucu, tapi fotonya banyak yang blur (setboi).', side: 'left', rotation: -1 },
  { id: '10', image: pict10, width: 4000, height: 3000, caption: 'Tugu', detail: 'ngantri buwat photobooth.', side: 'right', rotation: 2 },
  { id: '11', image: pict11, width: 3000, height: 4000, caption: 'After Photobooth', detail: 'fomok orang orang yang abis photobooth.', side: 'left', rotation: 1.5 },
  { id: '12', image: pict12, width: 960, height: 1280, caption: 'Jogja After Rain', detail: 'abis ketemu ipan.', side: 'right', rotation: -2 },
  { id: '13', image: pict13, width: 1066, height: 600, caption: 'No Caption', detail: 'LUCU BNGET, CANDUU.', side: 'left', rotation: -1 },
];
