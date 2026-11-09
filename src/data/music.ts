export interface Song {
  id: string;
  title: string;
  artist: string;
  file: string;
}

export const songs: Song[] = [
  {
    id: 'love',
    title: 'love.',
    artist: 'Wave to Earth',
    file: '/audio/wave-to-earth-love.mp3',
  },
  {
    id: 'perfection',
    title: 'Perfection (Sempurna English Ver.)',
    artist: 'BBIBEEB',
    file: '/audio/bbibeeb-perfection.mp3',
  },
  {
    id: 'glue-song',
    title: 'Glue Song',
    artist: 'beabadoobee',
    file: '/audio/beabadoobee-glue-song.mp3',
  },
];
