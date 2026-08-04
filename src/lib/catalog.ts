/**
 * Dil bağımsız ürün iskeleti: slug'lar, ikon anahtarları, rota yardımcıları.
 * Tüm METİNLER src/messages/{locale}.ts dosyalarında (products.* altında) yaşar.
 */

export const rollFormItems = [
  { slug: "kablo-kanali", icon: "kablo" },
  { slug: "solar-profil", icon: "solar" },
  { slug: "agir-raf", icon: "raf" },
  { slug: "iskele-kalas", icon: "iskele" },
  { slug: "yol-bariyeri", icon: "bariyer" },
  { slug: "gurultu-bariyeri", icon: "gurultu" },
  { slug: "c-sigma-omega", icon: "csigma" },
  /* Saha fotoğrafı henüz yok — ürün görseli bölümü basılmaz (bkz. hasPhoto) */
  { slug: "trapez-cephe-paneli", icon: "csigma", noPhoto: true },
] as const;

export const machineItems = [
  { slug: "rulo-acicilar" },
  { slug: "servo-suruculer" },
  { slug: "dogrultmali-servo-suruculer" },
  { slug: "kompakt-hatlar" },
  { slug: "otomatik-istifleyici", noPhoto: true },
] as const;

export type RollFormSlug = (typeof rollFormItems)[number]["slug"];
export type MachineSlug = (typeof machineItems)[number]["slug"];

export const rollFormSlugs = rollFormItems.map((i) => i.slug);
export const machineSlugs = machineItems.map((i) => i.slug);

export function isRollFormSlug(slug: string): slug is RollFormSlug {
  return (rollFormSlugs as string[]).includes(slug);
}

export function isMachineSlug(slug: string): slug is MachineSlug {
  return (machineSlugs as string[]).includes(slug);
}

/**
 * Bu ürünün `public/gorseller/{slug}.jpg` fotoğrafı var mı?
 *
 * Yeni ürünlerin saha fotoğrafı henüz gelmedi. Yer tutucu ya da alakasız
 * bir görsel koymak yerine bölüm hiç basılmıyor: kırık resim de, yanıltıcı
 * görsel de sayfaya zarar verir. Fotoğraf geldiğinde `noPhoto` satırını
 * silmek yeterli.
 */
export function hasPhoto(slug: string): boolean {
  const all = [...rollFormItems, ...machineItems] as ReadonlyArray<{
    slug: string;
    noPhoto?: boolean;
  }>;
  return !all.find((i) => i.slug === slug)?.noPhoto;
}

export function rollFormIcon(slug: string) {
  return rollFormItems.find((i) => i.slug === slug)?.icon;
}
