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
    description: 'blum pernah kesana, katanya sih enak. tpi tempatnya di pasar',
    latitude: -7.552372784489211,
    longitude: 110.85986399489016,
  },
  {
    id: 'mie-ayam-worth-it',
    title: 'Mie Ayam Worth It',
    description: 'keknya beneran worth it si, waktu itu juga rame kan. moga klo milih ini gk ketemu silvi lagi',
    latitude: -7.550042383516451,
    longitude: 110.86104288324695,
  },
  {
    id: 'solo-square',
    title: 'Solo Square XXI',
    description: 'enaktuh buat nonton. klo emng mw si. btw klo emng mw ke bioskop mending mam dulu, biar nggak plenger',
    latitude: -7.560842310271578,
    longitude: 110.78852662557664,
  },
  {
    id: 'dikichi-solo',
    title: 'Dikichi Solo',
    description: 'katanya sih ayam no 1 se indo, gtw bener enggak. belum coba soalnya hhe',
    latitude: -7.543494,
    longitude: 110.770035,
  },
  {
    id: 'balai-kota',
    title: 'Balkot Surakarta',
    description: 'enak kayaknya klo buat cerita cerita, bisa ke streetfood dideket sana juga',
    latitude: -7.569102099686291, 
    longitude: 110.82957039533673
  },
  {
    id: 'momoyok',
    title: 'Momoyo Coyudan',
    description: 'klo dessert mah yang pasti-pasti aja yakan. biar ntar gak nyesel',
    latitude: -7.574012,
    longitude: 110.821605,
  },
  {
    id: 'seblak-massbond',
    title: 'Seblak Massbond',
    description: 'gtw si masukin aja. gw gtw tempat seblak seblak gni, maybe enak. MAYBE LOHYA',
    latitude: -7.55045472562746,
    longitude: 110.81394444276832,
  },
  {
    id: 'lokananta',
    title: 'Lokananta',
    description: 'kayaknya nyaman klo buat cerita cerita, kayak pas di alun-alun',
    latitude: -7.557610437263933,
    longitude: 110.79560345256228,
  },
  {
    id: 'u-co-steak',
    title: 'U&Co Steak',
    description: 'klo mw steak disini enak, KATANYA juga sih',
    latitude: -7.574575152920673,
    longitude: 110.82564019489072
  },
];

