export interface ConstellationMemory {
  src: string;
  title: string;
  caption: string;
}

const memoryEntries = [
  { fileName: 'IMG-20260418-WA0016.webp', title: 'apatu', caption: 'wohoho gak espek bakal dikasih hadiah hheee.' },
  { fileName: 'IMG-20260418-WA0022.webp', title: 'kukis & sopi', caption: 'mwehehehe lucukkk, ekornya bisa bentuk love.' },
  { fileName: 'IMG-20260927-WA0074.webp', title: 'P', caption: 'awal-awal sering dm an buat info main hhee.' },
  { fileName: 'PicRetouch_20250103_000911693.webp', title: 'artefak', caption: 'sebelum before kapel nick, pp, hr, sq, bio, everything about moleh.' },
  { fileName: 'Screenshot_20250708_004009_Mobile Legends Bang Bang.webp', title: '8-juli-2025', caption: 'bikin lovers buat bahan konten.' },
  { fileName: 'Screenshot_20250921_193407_Magic Chess GO GO.webp', title: 'guin rora', caption: 'game 1 aku yang mvp, game 2 kmu yang mvp.' },
  { fileName: 'Screenshot_20251129_171826_Mobile Legends Bang Bang.webp', title: 'still mcgg', caption: 'waktu aku rehat ml, trus sering on mcgg.' },
  { fileName: 'Screenshot_20260416_071657_WhatsApp.webp', title: 'wutwut', caption: 'gk espek hehee tengah malem. nangis pulak waktu itu, hhee.' },
  { fileName: 'Screenshot_20260430_214737_WhatsApp.webp', title: 'telkontol', caption: 'baru juga hilang sinyal 2 menit, apalagi sehari. kek pas hp ku rusak wkwkkw.' },
  { fileName: 'Screenshot_20260526_234226_Soul Knight.webp', title: 'bened luoyi', caption: 'wohohoho duo pembantai solknek, kayaknya h-1 lebaran yak waktu itu.' },
  { fileName: 'Screenshot_20260531_005505_WhatsApp.webp', title: 'koling-koling', caption: 'waktu pertama kali kita telponan, yang lama si, klo bentar doang kayaknya ada yang lebih dulu.' },
  { fileName: 'Screenshot_20260620_235855_TikTok.webp', title: 'pura-pura gkliat', caption: 'ripiw akun DOANG tuh.' },
  { fileName: 'Screenshot_20260701_235249_WhatsApp.webp', title: 'eee', caption: 'pdahal bukan pertama kali digift sl. lucu bnget lagi wkwkwk.' },
  { fileName: 'Screenshot_20260806_234754_Discord.webp', title: 'dc', caption: 'nahhh ini koling pertama, di dc si. waktu ngeliatin kmu ngedit hhee.' },
  { fileName: 'Screenshot_20260811_154832_WhatsApp.webp', title: 'ipan', caption: 'bloon bnget sial "fresh date".' },
  { fileName: 'Screenshot_20260927_173805_Instagram.webp', title: 'mw kukirim stiker gk', caption: 'berawal dari mw kirim stiker lohyah.' },
  { fileName: 'Screenshot_20260927_174554_Instagram.webp', title: 'info goldlane', caption: 'ternyata gw jago yah, ampe dicariin gni. upsi.' },
  { fileName: 'Screenshot_20261112_195500_WhatsApp.webp', title: 'malu sih kataku', caption: 'bro sudah menjelaskan panjang lebar kali tinggi pdhal dia salah membaca chat ku.' },
  { fileName: 'Screenshot_20261112_195558_WhatsApp.webp', title: 'typo stadium akhir', caption: 'sini gw tutorin caranya ngetik yam.' },
  { fileName: 'Screenshot_20261112_195931_WhatsApp.webp', title: 'ngevent yuk', caption: 'katanya temennya pada bawa cowok, pdahal ada yang nggak. tapi gapapa wkwkw, seru soalnya. mana ke alun-alun kidul jugak.' },
  { fileName: 'Screenshot_20261114_193401_Gallery (2).webp', title: 'kapel pp', caption: 'kumpulan pp kapel doang si entah tt, wa, ato moleh.' },
  { fileName: 'Screenshot_20251202_045100_Magic Chess GO GO.webp', title: 'mcgg again', caption: 'masih waktu aku rehat ml *wkwkkw ada yang kangen ups.' },
  { fileName: 'Screenshot_20260405_233325_Mobile Legends Bang Bang.webp', title: 'hbd', caption: 'kukira awal nya hadiahnya ini njrr, ternyata hadiah rl nya juga ada.' },
];

export const constellationMemories: readonly ConstellationMemory[] = memoryEntries.map(({ fileName, title, caption }) => ({
  src: `${import.meta.env.BASE_URL}assets/something/${encodeURIComponent(fileName)}`,
  title,
  caption,
}));
