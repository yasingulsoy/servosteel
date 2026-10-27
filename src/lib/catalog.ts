/**
 * Dil bağımsız ürün iskeleti: slug'lar, ikon anahtarları, rota yardımcıları.
 * Tüm METİNLER src/messages/{locale}.ts dosyalarında (products.* altında) yaşar.
 */

export const rollFormItems = [
  { slug: "kablo-kanali", icon: "kablo" },
  {
    slug: "solar-profil",
    icon: "solar",
    /* Vitrin (bkz. showcaseOf): C profil hattı — kesme ünitesiyle hat, istasyonlar
       (arkada Servo Punch Pres), genel görünüm. Sayfada ana fotoğrafın (kırmızı
       100. yıl kesme kafası) yerini alır; ana fotoğraf kartlarda duruyor. */
    showcase: [
      { file: "solar-profil-hat.jpg", width: 1290, height: 716 },
      { file: "solar-profil-istasyonlar.jpg", width: 5120, height: 3840 },
      { file: "solar-profil-genel.jpg", width: 4032, height: 3024 },
    ],
    hideMainPhoto: true,
  },
  { slug: "agir-raf", icon: "raf" },
  { slug: "iskele-kalas", icon: "iskele" },
  { slug: "yol-bariyeri", icon: "bariyer" },
  { slug: "gurultu-bariyeri", icon: "gurultu" },
  {
    slug: "c-sigma-omega",
    icon: "csigma",
    /* Vitrin (bkz. showcaseOf): C profil kesme ünitesi ve kalıp yakın planları.
       Sayfada ana fotoğrafın yerini alır; ana fotoğraf kartlarda duruyor. */
    showcase: [
      { file: "c-sigma-omega-kesme.jpg", width: 1290, height: 713 },
      { file: "c-sigma-omega-kesme-kafasi.jpg", width: 4032, height: 3024 },
      { file: "c-sigma-omega-kalip.jpg", width: 4032, height: 3024 },
    ],
    hideMainPhoto: true,
  },
  /* Saha fotoğrafı henüz yok — ürün görseli bölümü basılmaz (bkz. hasPhoto) */
  { slug: "trapez-cephe-paneli", icon: "csigma", noPhoto: true },
] as const;

export const machineItems = [
  { slug: "rulo-acicilar" },
  { slug: "servo-suruculer" },
  { slug: "dogrultmali-servo-suruculer" },
  {
    slug: "kompakt-hatlar",
    /* Vitrin fotoğrafı (bkz. showcaseOf): pres besleme hattı — doğrultmalı sürücü, açıcı, rulo arabası */
    showcase: [{ file: "kompakt-hatlar-pres-besleme.jpg", width: 1600, height: 764 }],
  },
  {
    slug: "servo-punch-pres",
    /* Vitrin (bkz. showcaseOf): SRV-SP6 önden (şeritle) ve yandan. Ana fotoğraf
       da önden görünüm — kartlarda o kullanılıyor, sayfada vitrin yeter.
       Yan sütun (bkz. galleryOf): açıcı/sürücüyle hatta, doğrultmalı sürücüyle. */
    showcase: [
      { file: "servo-punch-pres.jpg", width: 5120, height: 3840 },
      { file: "servo-punch-pres-yan.jpg", width: 5120, height: 3840 },
    ],
    hideMainPhoto: true,
    gallery: [
      { file: "servo-punch-pres-besleme.jpg", ratio: "video" },
      { file: "servo-punch-pres-dogrultma.jpg", ratio: "video" },
    ],
  },
  {
    slug: "otomatik-istifleyici",
    /* Vitrin (bkz. showcaseOf): profil hattı sonunda istif + çemberleme, paket yakın plan.
       Ana fotoğraf (levha istifi) bu sayfada gösterilmiyor (Yasin, 27 Eki);
       ana sayfadaki ve /makineler'deki kartlarda duruyor. */
    showcase: [
      { file: "otomatik-istifleyici-hat.jpg", width: 1027, height: 771 },
      { file: "otomatik-istifleyici-paket.jpg", width: 1004, height: 754 },
    ],
    hideMainPhoto: true,
  },
] as const;

/**
 * Makine varyantları — bir makine sayfasının altındaki alt sayfalar.
 * `/makineler/rulo-acicilar/hidrolik`
 *
 * Üst sayfa hub olarak KALIR: "rulo açıcılar" kelimesinde 7. sırada ve
 * içeriği duruyor. Varyantlar onun yerine geçmiyor, altına derinlik ekliyor —
 * katalogdaki model listeleri özet tabloya sığmıyordu.
 *
 * Slug'ların URL çevirisi src/i18n/slugs.ts VARIANT_SLUGS'ta; iki liste
 * ayrışırsa routing.ts açılışta hata fırlatır.
 */
export const machineVariants = [
  { parent: "rulo-acicilar", slug: "hidrolik" },
  { parent: "rulo-acicilar", slug: "mekanik" },
  { parent: "servo-suruculer", slug: "mini" },
  { parent: "servo-suruculer", slug: "kasali" },
  { parent: "dogrultmali-servo-suruculer", slug: "mini" },
  { parent: "dogrultmali-servo-suruculer", slug: "kasali" },
] as const;

export type MachineVariant = (typeof machineVariants)[number];

export function isMachineVariant(parent: string, slug: string): boolean {
  return machineVariants.some((v) => v.parent === parent && v.slug === slug);
}

/** Bir makinenin varyantları (yoksa boş dizi). */
export function variantsOf(parent: string) {
  return machineVariants.filter((v) => v.parent === parent);
}

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

type GaleriFoto = { file: string; ratio: "4/3" | "square" | "video" };

/**
 * Makinenin ana fotoğrafının altında gösterilen ek fotoğraflar (`public/gorseller/`).
 * Alt metinleri mesaj dosyasında `products.machines.<slug>.galleryAlt`, aynı sırayla.
 */
export function galleryOf(slug: string): readonly GaleriFoto[] {
  const all = machineItems as ReadonlyArray<{ slug: string; gallery?: readonly GaleriFoto[] }>;
  return all.find((i) => i.slug === slug)?.gallery ?? [];
}

type Vitrin = { file: string; width: number; height: number };
type VitrinliOge = { slug: string; showcase?: readonly Vitrin[]; hideMainPhoto?: boolean };

const vitrinliOgeler = [...rollFormItems, ...machineItems] as ReadonlyArray<VitrinliOge>;

/**
 * Sayfa başlığının hemen altında, kırpılmadan gösterilen vitrin fotoğrafları
 * (`public/gorseller/`, bkz. components/vitrin.tsx). Geniş saha fotoğrafları
 * yan sütunun 4:3 kutusunda kenarlarından kırpılıyordu. Ölçüler dosyanın
 * gerçek pikselleri: en-boy oranı bunlardan gelir, yüklenirken sayfa kaymaz.
 * Alt metinleri mesaj dosyasında `products.{machines|rollform}.<slug>.showcaseAlt`,
 * aynı sırayla.
 */
export function showcaseOf(slug: string): readonly Vitrin[] {
  return vitrinliOgeler.find((i) => i.slug === slug)?.showcase ?? [];
}

/** Ana fotoğraf ürün sayfasında gösterilmesin mi (vitrin onun yerini alır). */
export function hidesMainPhoto(slug: string): boolean {
  return !!vitrinliOgeler.find((i) => i.slug === slug)?.hideMainPhoto;
}

/**
 * Sayfanın paylaşım/şema görseli: ana fotoğraf sayfada gösterilmiyorsa sayfada
 * görünen ilk vitrin fotoğrafı.
 */
export function pageImageOf(slug: string): string | undefined {
  if (!hasPhoto(slug)) return undefined;
  const vitrin = showcaseOf(slug);
  return hidesMainPhoto(slug) && vitrin.length ? `/gorseller/${vitrin[0].file}` : `/gorseller/${slug}.jpg`;
}

export function rollFormIcon(slug: string) {
  return rollFormItems.find((i) => i.slug === slug)?.icon;
}
