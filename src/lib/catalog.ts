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
  {
    slug: "rulo-acicilar",
    /* "Kullanım alanları" çiplerinin bağlantısı, `sectors` SIRASINA göre (bkz.
       usageLinksOf): Pres besleme, Dilme, Boy kesme, Roll form — 9 dilde aynı sıra */
    usageLinks: ["/makineler", "/dilme-hatlari", "/boy-kesme-hatlari", "/roll-form-hatlari"],
    /* Başlığın altındaki tip şeridi (bkz. typesOf): her tip ayrı etiketle,
       sayfası olan tipe bağlantı. Etiket ve alt metinleri mesaj dosyasında
       `products.machines.rulo-acicilar.types`, aynı sırayla. `konum`: kare
       kutuda kırpılırken makinenin kalacağı yer (CSS object-position). */
    types: [
      { file: "hidrolik-rulo-acici.jpg", href: "/makineler/rulo-acicilar/hidrolik", konum: "45% 50%" },
      { file: "mekanik-rulo-acici.jpg", href: "/makineler/rulo-acicilar/mekanik", konum: "30% 50%" },
      { file: "cift-kafa-rulo-acici.jpg", konum: "50% 62%" },
    ],
    /* Yan sütun (bkz. galleryOf): çift kafanın yandan görünümü — bu tipin
       kendi sayfası yok, ikinci fotoğrafı burada. */
    gallery: [{ file: "cift-kafa-rulo-acici-2.jpg", ratio: "3/4" }],
    /* Başlığın altındaki YouTube şeridi bu sayfada ve varyantlarında yok
       (Yasin, 11 Kas): yerini tip şeridi ve sitenin kendi klibi aldı.
       YouTube videoları /videolar'da duruyor. */
    hideVideos: true,
    /* Sahadan klip (bkz. clipsOf): kompakt hattaki rulo arabalı açıcı, yatay */
    clips: [
      { src: "/kompakt-hat-yatay.mp4", poster: "/kompakt-hat-yatay-poster.jpg", width: 848, height: 480, sec: 19, tarih: "2026-11-11" },
    ],
  },
  { slug: "servo-suruculer" },
  { slug: "dogrultmali-servo-suruculer" },
  {
    slug: "kompakt-hatlar",
    /* Vitrin fotoğrafı (bkz. showcaseOf): pres besleme hattı — doğrultmalı sürücü, açıcı, rulo arabası */
    showcase: [{ file: "kompakt-hatlar-pres-besleme.jpg", width: 1600, height: 764 }],
    /* Kaldırılan "Kompakt hat testi" YouTube videosunun yerine dikey saha klibi */
    clips: [
      { src: "/kompakt-hat-dikey.mp4", poster: "/kompakt-hat-dikey-poster.jpg", width: 480, height: 848, sec: 15, tarih: "2026-11-11" },
    ],
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
    /* Sonuna takıldığı hatlar — kullanım çiplerinin önüne bağlantılı çip olarak
       (bkz. linesOf). Dilme yok: dilme hattı levha istiflemez, ruloyu geri sarar. */
    lines: ["/boy-kesme-hatlari", "/roll-form-hatlari"],
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
  /* photos: sayfanın yan sütunundaki fotoğraflar (bkz. variantPhotosOf); alt
     metinleri `products.variants.<parent>.<slug>.photoAlt`, aynı sırayla.
     Yeni fotoğraf gelince diziye eklemek yeter. */
  {
    parent: "rulo-acicilar",
    slug: "hidrolik",
    photos: [
      { file: "hidrolik-rulo-acici.jpg", width: 1536, height: 1137 },
      { file: "hidrolik-rulo-acici-2.jpg", width: 1066, height: 1600 },
    ],
  },
  {
    parent: "rulo-acicilar",
    slug: "mekanik",
    photos: [{ file: "mekanik-rulo-acici.jpg", width: 1600, height: 1066 }],
  },
  { parent: "servo-suruculer", slug: "mini" },
  { parent: "servo-suruculer", slug: "kasali" },
  { parent: "dogrultmali-servo-suruculer", slug: "mini" },
  { parent: "dogrultmali-servo-suruculer", slug: "kasali" },
] as const;

export type MachineVariant = (typeof machineVariants)[number];

export function isMachineVariant(parent: string, slug: string): boolean {
  return machineVariants.some((v) => v.parent === parent && v.slug === slug);
}

type UrunFoto = { file: string; width: number; height: number };

/** Varyant sayfasının fotoğrafları (`public/gorseller/`); yoksa boş dizi. */
export function variantPhotosOf(parent: string, slug: string): readonly UrunFoto[] {
  const v = (machineVariants as ReadonlyArray<{ parent: string; slug: string; photos?: readonly UrunFoto[] }>).find(
    (x) => x.parent === parent && x.slug === slug
  );
  return v?.photos ?? [];
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

type GaleriFoto = { file: string; ratio: "4/3" | "square" | "video" | "3/4" };

type TipFoto = { file: string; href?: string; konum?: string };

/**
 * Ürün sayfasında başlığın altındaki tip şeridi (bkz. components/tip-seridi.tsx):
 * makinenin tipleri yan yana, her biri kendi etiketiyle.
 */
export function typesOf(slug: string): readonly TipFoto[] {
  const all = machineItems as ReadonlyArray<{ slug: string; types?: readonly TipFoto[] }>;
  return all.find((i) => i.slug === slug)?.types ?? [];
}

type Klip = { src: string; poster: string; width: number; height: number; sec: number; tarih: string };

/**
 * Sitede barındırılan saha klipleri (public/ altında, sessiz, döngü) —
 * "Sahadan görüntüler" bölümünde YouTube kartlarından sonra gelir.
 * Başlıkları mesaj dosyasında `products.machines.<slug>.clips`, aynı sırayla.
 */
export function clipsOf(slug: string): readonly Klip[] {
  return (machineItems as ReadonlyArray<{ slug: string; clips?: readonly Klip[] }>).find((i) => i.slug === slug)?.clips ?? [];
}

/** Başlığın altındaki YouTube şeridi bu makinede (ve varyantlarında) basılmasın mı. */
export function hidesVideos(slug: string): boolean {
  return !!(machineItems as ReadonlyArray<{ slug: string; hideVideos?: boolean }>).find((i) => i.slug === slug)?.hideVideos;
}

/**
 * Makinenin ana fotoğrafının altında gösterilen ek fotoğraflar (`public/gorseller/`).
 * Alt metinleri mesaj dosyasında `products.machines.<slug>.galleryAlt`, aynı sırayla.
 */
export function galleryOf(slug: string): readonly GaleriFoto[] {
  const all = machineItems as ReadonlyArray<{ slug: string; gallery?: readonly GaleriFoto[] }>;
  return all.find((i) => i.slug === slug)?.gallery ?? [];
}

type BaglantiliMakine = { slug: string; usageLinks?: readonly string[]; lines?: readonly string[] };

/**
 * Makine sayfasındaki "Kullanım alanları" çiplerinin bağlantıları —
 * `products.machines.<slug>.sectors` ile AYNI SIRADA. Boş dizi: çipler düz metin.
 * Hat sayfaları ile makine sayfaları arasında karşılıklı bağlantı (2026-10-28).
 */
export function usageLinksOf(slug: string): readonly string[] {
  return (machineItems as ReadonlyArray<BaglantiliMakine>).find((i) => i.slug === slug)?.usageLinks ?? [];
}

/** Makinenin sonuna takıldığı hat sayfaları — kullanım çiplerinin önünde bağlantılı çip. */
export function linesOf(slug: string): readonly string[] {
  return (machineItems as ReadonlyArray<BaglantiliMakine>).find((i) => i.slug === slug)?.lines ?? [];
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

/**
 * Ürün sayfasında GÖRÜNEN fotoğraflar (site kökünden yol) — site haritasının
 * görsel etiketleri için (`<image:image>`), Google Görseller'in sayfayla
 * eşleştirmesi için. Sayfada gösterilmeyen ana fotoğraf (hideMainPhoto) girmez.
 *
 * `path` dahili yol: `/makineler/rulo-acicilar`, `/makineler/rulo-acicilar/hidrolik`,
 * `/roll-form-hatlari/solar-profil`. Ürün sayfası değilse boş dizi.
 */
export function pageImagesOf(path: string): string[] {
  const [bolum, slug, varyant] = path.split("/").filter(Boolean);
  if (bolum === "makineler" && slug && varyant) {
    return variantPhotosOf(slug, varyant).map((f) => `/gorseller/${f.file}`);
  }
  const urun = (bolum === "makineler" && isMachineSlug(slug ?? "")) || (bolum === "roll-form-hatlari" && isRollFormSlug(slug ?? ""));
  if (!urun || !slug) return [];
  const dosyalar = [
    ...(hasPhoto(slug) && !hidesMainPhoto(slug) ? [`${slug}.jpg`] : []),
    ...showcaseOf(slug).map((v) => v.file),
    ...typesOf(slug).map((v) => v.file),
    ...galleryOf(slug).map((g) => g.file),
  ];
  return [...new Set(dosyalar)].map((f) => `/gorseller/${f}`);
}

export function rollFormIcon(slug: string) {
  return rollFormItems.find((i) => i.slug === slug)?.icon;
}
