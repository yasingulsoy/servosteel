import type { AppLocale } from "./routing";

/**
 * URL slug'larının TEK kaynağı.
 *
 * Türkçe kökte yaşar ve Türkçe slug kullanır (`/dilme-hatlari`). Diğer sekiz dil
 * İngilizce slug alır (`/en/coil-slitting-lines`, `/de/coil-slitting-lines`).
 *
 * Neden dil başına ayrı slug DEĞİL: Macarca/Lehçe makine terminolojisi uzmanlık
 * işidir ve ana dili konuşan teknik bir gözden geçiren olmadan üretilen slug,
 * İngilizce'den kötü olur. "coil slitting line" bu sektörde Almanya'da da
 * Polonya'da da anlaşılan ortak dildir.
 *
 * İngilizce karşılıklar mümkün olduğunca ESKİ WordPress slug'larıyla aynı
 * tutuldu (`/product/servo-feeders/`, `/about-us/`, `/roll-forming-lines/`):
 * Google bu terimleri zaten bu sitede gördü, 301 hedefleriyle de birebir oturur.
 */

/**
 * Slug tablolarının yazıldığı dil. routing.ts bunu `defaultLocale` olarak
 * kullanır — böylece ikisi yapı gereği ayrışamaz.
 *
 * NOT: yukarıdaki import yalnızca TİP içindir (çalışma anında silinir); değer
 * olarak routing'i içeri almak slugs <-> routing döngüsü yaratırdı.
 */
export const SLUG_BASE_LOCALE = "tr";

/** Rota segmentleri (bölüm kökleri). */
export const ROUTE_SLUGS = {
  "dilme-hatlari": "coil-slitting-lines",
  "boy-kesme-hatlari": "cut-to-length-lines",
  "roll-form-hatlari": "roll-forming-lines",
  makineler: "machines",
  hakkimizda: "about-us",
  iletisim: "contact-us",
  "teklif-al": "request-quote",
  referanslar: "references",
  videolar: "videos",
  akademi: "academy",
  hesaplayicilar: "calculators",
  karsilastirma: "comparison",
  uygulamalar: "applications",
  surdurulebilirlik: "sustainability",
} as const;

/**
 * Dinamik segment ([slug]) değerleri — ÜST BÖLÜME GÖRE gruplu.
 *
 * Gruplama şart: routing.ts bunlardan `/makineler/rulo-acicilar` gibi SOMUT
 * yollar üretip `pathnames`e koyuyor. Somut yol olunca next-intl gelen isteği
 * (`/en/machines/decoilers`) dahili Türkçe yola kendisi çeviriyor; sayfalar,
 * generateStaticParams ve tüm `Link`'ler Türkçe id ile çalışmaya devam ediyor.
 * Yalnızca `[slug]` deseni konsaydı dinamik değer çevrilmeden geçerdi ve her
 * bağlantı kurulan yeri elle düzeltmek gerekirdi.
 */
export const CONTENT_SLUGS = {
  makineler: {
    "rulo-acicilar": "decoilers",
    "servo-suruculer": "servo-feeders",
    "dogrultmali-servo-suruculer": "straightener-servo-feeders",
    "kompakt-hatlar": "compact-lines",
    "otomatik-istifleyici": "automatic-stacker",
  },
  "roll-form-hatlari": {
    "kablo-kanali": "cable-tray",
    "solar-profil": "solar-panel-profile",
    "agir-raf": "storage-rack",
    "iskele-kalas": "scaffolding-plank",
    "yol-bariyeri": "guard-rail",
    "gurultu-bariyeri": "noise-barrier",
    "c-sigma-omega": "c-sigma-omega-profiles",
    "trapez-cephe-paneli": "trapezoidal-and-facade-panel",
  },
  karsilastirma: {
    "dilme-vs-boy-kesme": "slitting-vs-cut-to-length",
    "hidrolik-vs-mekanik-acici": "hydraulic-vs-mechanical-decoiler",
    "servo-vs-mekanik-besleme": "servo-vs-mechanical-feeding",
  },
  uygulamalar: {
    enerji: "energy",
    insaat: "construction",
    "lojistik-depolama": "logistics-and-storage",
    "otomotiv-beyaz-esya": "automotive-and-appliances",
    "metal-mobilya": "metal-furniture-and-retail",
    "makine-ekipman": "machinery-and-equipment",
  },
  /* MDX dosya adları Türkçe kalır — içerik tek kaynak, yalnızca URL çevrilir */
  akademi: {
    "boy-kesme-hatti-nasil-secilir": "how-to-choose-a-cut-to-length-line",
    "rulo-dilme-hatti-nasil-secilir": "how-to-choose-a-slitting-line",
    "servo-besleyici-nasil-secilir": "how-to-choose-a-servo-feeder",
    "rulo-agirligi-ve-uzunlugu-nasil-hesaplanir": "how-to-calculate-coil-weight-and-length",
    "sac-fire-oranini-dusurmek": "reducing-sheet-metal-scrap-rate",
    "progresif-kalip-servo-besleyici-secimi": "servo-feeder-selection-for-progressive-dies",
    "solar-profil-hatti-yatirim-geri-donusu": "solar-profile-line-roi",
    "rulo-dilme-hatti-maliyeti": "coil-slitting-line-cost",
    "rulo-hatti-nereden-alinmali": "where-to-buy-a-coil-processing-line",
  },
} as const satisfies Record<keyof typeof ROUTE_SLUGS | string, Record<string, string>>;

/** Gruplu içerik tablosunu düzleştirir. */
const FLAT_CONTENT: Record<string, string> = Object.assign(
  {},
  ...Object.values(CONTENT_SLUGS)
);

/** Rota + içerik birleşimi; tam yol çevirisi için. */
const ALL_SLUGS: Record<string, string> = { ...ROUTE_SLUGS, ...FLAT_CONTENT };

/**
 * Aynı İngilizce slug'a iki Türkçe slug bağlanırsa yollar çakışır ve yanlış
 * sayfa açılır. Modül yüklenirken patlaması, üretimde sessizce yanlış içerik
 * sunmasına yeğdir.
 */
const seen: Record<string, string> = {};
for (const [tr, en] of Object.entries(ALL_SLUGS)) {
  if (seen[en]) {
    throw new Error(`slugs.ts: "${en}" iki Türkçe slug'a birden bağlı — "${seen[en]}" ve "${tr}"`);
  }
  seen[en] = tr;
}

/** Bu locale Türkçe slug mı kullanıyor? (yalnızca varsayılan dil) */
function usesTurkish(locale: string) {
  return locale === SLUG_BASE_LOCALE;
}

/**
 * Bir yolun TÜM segmentlerini (rota + içerik) locale'e çevirir.
 *
 * next-intl `Link`'ten GEÇMEYEN yerler için: canonical, hreflang, sitemap,
 * llms.txt. Bunlar mutlak URL üretir ve next-intl'in çevirisinden faydalanamaz.
 * Bileşenlerdeki `<Link href="/makineler/rulo-acicilar">` için gerekmez —
 * onu `pathnames` hallediyor.
 */
export function localizeFullPath(path: string, locale: AppLocale | string): string {
  if (usesTurkish(locale)) return path;
  return path
    .split("/")
    .map((seg) => ALL_SLUGS[seg] ?? seg)
    .join("/");
}
