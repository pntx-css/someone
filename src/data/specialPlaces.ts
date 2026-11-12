import type { Coordinates } from './customPlace';

export interface DefaultPlace extends Coordinates {
  id: string;
  title: string;
  description: string;
}

export interface DefaultPlacePlaceholder {
  id: string;
  title: string;
}

export const specialPlaces: DefaultPlace[] = [
  {
    id: 'mie-serasi-uns',
    title: 'Mie Serasi UNS',
    description: 'Mie Serasi UNS',
    latitude: -7.552372784489211,
    longitude: 110.85986399489016,
  },
  {
    id: 'mie-ayam-worth-it',
    title: 'Mie Ayam Worth It',
    description: 'Mie Ayam Worth It',
    latitude: -7.550042383516451,
    longitude: 110.86104288324695,
  },
  {
    id: 'solo-square',
    title: 'Solo Square',
    description: 'Solo Square',
    latitude: -7.560842310271578,
    longitude: 110.78852662557664,
  },
];

export const specialPlacePlaceholders: DefaultPlacePlaceholder[] = [
  { id: 'recommendation-4', title: 'Saran tempat 04' },
  { id: 'recommendation-5', title: 'Saran tempat 05' },
  { id: 'recommendation-6', title: 'Saran tempat 06' },
  { id: 'recommendation-7', title: 'Saran tempat 07' },
  { id: 'recommendation-8', title: 'Saran tempat 08' },
];
