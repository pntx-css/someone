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
    id: 'we-cook-noodles-and-wings',
    title: 'We Cook Noodles and Wings',
    description: 'blum pernah kesana, tapi rating google nya tinggi njr',
    latitude: -7.545591,
    longitude: 110.770738,
  },
  {
    id: 'mie-ayam-worth-it',
    title: 'Mie Ayam Worth It',
    description: 'keknya beneran worth it si, waktu itu juga rame kan. moga klo milih ini gk ketemu silvi lagi',
    latitude: -7.550031747694307, 
    longitude: 110.86095705256122,
  },
  {
    id: 'solo-square',
    title: 'Solo Square XXI',
    description: 'enaktuh buat nonton. klo emng mw si. btw klo emng mw ke bioskop mending mam dulu, biar nggak plenger',
    latitude: -7.56078107468666, 
    longitude: 110.78863233721871,
  },
  {
    id: 'dikichi-solo',
    title: 'Dikichi Solo',
    description: 'katanya sih ayam no 1 se indo, gtw bener enggak. belum coba soalnya hhe',
    latitude: -7.543398144764399, 
    longitude: 110.77002249489023,
  },
  {
    id: 'balai-kota',
    title: 'Balkot Surakarta',
    description: 'enak kayaknya klo buat cerita cerita, bisa ke streetfood dideket sana juga',
    latitude: -7.569139167349101,  
    longitude: 110.82961545256178,
  },
  {
    id: 'momoyok',
    title: 'Momoyo Coyudan',
    description: 'klo dessert mah yang pasti-pasti aja yakan. biar ntar gak nyesel',
    latitude: -7.573912487806288, 
    longitude: 110.82204078139726,
  },
  {
    id: 'seblak-massbond',
    title: 'Seblak Massbond',
    description: 'gtw si masukin aja. gw gtw tempat seblak seblak gni, maybe enak. MAYBE LOHYA',
    latitude: -7.550518540493909, 
    longitude: 110.81375132372544,
  },
  {
    id: 'lokananta',
    title: 'Lokananta',
    description: 'kayaknya nyaman klo buat cerita cerita, kayak pas di alun-alun',
    latitude: -7.557716793607948, 
    longitude: 110.7955605372194,
  },
  {
    id: 'u-co-steak',
    title: 'U&Co Steak',
    description: 'klo mw steak disini enak, KATANYA juga sih',
    latitude: -7.574596423355014, 
    longitude: 110.82568311023358
  },
];

