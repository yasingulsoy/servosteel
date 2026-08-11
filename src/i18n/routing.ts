import { defineRouting } from "next-intl/routing";
import { ROUTE_SLUGS, CONTENT_SLUGS, VARIANT_SLUGS, SLUG_BASE_LOCALE } from "./slugs";

const LOCALES = ["tr", "en", "de", "es", "it", "hu", "pl", "ru", "ar"] as const;

/** Bir yolu her locale'e dağıtır: varsayılan dil Türkçe'yi, diğerleri İngilizce'yi alır. */
function forAllLocales(tr: string, en: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, l === SLUG_BASE_LOCALE ? tr : en]));
}

/**
 * Dile göre URL yolları. slugs.ts'ten ÜRETİLİR — elle yazılan ikinci bir liste
 * tutulmadığı için ikisi ayrışamaz.
 *
 * Dinamik segmentler `[slug]` DESENİ olarak değil, SOMUT yol olarak yazılır
 * (`/makineler/rulo-acicilar` -> `/machines/decoilers`). Sebebi: next-intl
 * dinamik segmentin DEĞERİNİ çevirmez, olduğu gibi geçirir. Somut yol yazınca
 * gelen `/en/machines/decoilers` isteği dahili `/makineler/rulo-acicilar`
 * yoluna çevriliyor; böylece sayfalar, generateStaticParams ve MDX içindeki
 * ~440 iç link Türkçe id ile çalışmaya devam ediyor — tek satır değişmeden.
 *
 * Tip bilerek geniş (Record<string, ...>) bırakıldı: `pathnames` harfi harfine
 * tiplenirse next-intl'in `Link`'i yalnızca bilinen desenleri kabul eder ve
 * `href={`/makineler/${m.slug}`}` gibi şablon dizeleri derlenmez.
 */
function buildPathnames(): Record<string, Record<string, string> | string> {
  const map: Record<string, Record<string, string> | string> = { "/": "/" };

  for (const [tr, en] of Object.entries(ROUTE_SLUGS)) {
    map[`/${tr}`] = forAllLocales(`/${tr}`, `/${en}`);
  }

  for (const [parent, children] of Object.entries(CONTENT_SLUGS)) {
    const enParent = ROUTE_SLUGS[parent as keyof typeof ROUTE_SLUGS];
    for (const [trSlug, enSlug] of Object.entries(children as Record<string, string>)) {
      map[`/${parent}/${trSlug}`] = forAllLocales(`/${parent}/${trSlug}`, `/${enParent}/${enSlug}`);
    }
  }

  /* Üçüncü seviye: /makineler/rulo-acicilar/hidrolik
     Üst yolun İngilizcesi yukarıda zaten üretildi; onu yeniden hesaplamak yerine
     haritadan okuyoruz — iki yerde ayrı hesaplanırsa ayrışabilirler. */
  for (const [trParent, children] of Object.entries(VARIANT_SLUGS)) {
    const ust = map[`/${trParent}`];
    if (typeof ust !== "object") {
      throw new Error(`routing.ts: "${trParent}" üst yolu pathnames'te yok — VARIANT_SLUGS anahtarı yanlış`);
    }
    const enParent = ust.en;
    for (const [trSlug, enSlug] of Object.entries(children as Record<string, string>)) {
      map[`/${trParent}/${trSlug}`] = forAllLocales(
        `/${trParent}/${trSlug}`,
        `${enParent}/${enSlug}`
      );
    }
  }

  return map;
}

export const routing = defineRouting({
  locales: LOCALES,
  /* slugs.ts ile ortak — slug tabloları bu dilde yazılı */
  defaultLocale: SLUG_BASE_LOCALE,
  /* tr kökte yaşar (/), diğer diller prefix alır (/en, /ru, /ar ...) */
  localePrefix: "as-needed",
  /* Otomatik dil algılama kapalı: / her zaman Türkçe açılır, dili kullanıcı seçer. */
  localeDetection: false,
  /* Türkçe slug kökte, diğer sekiz dilde İngilizce slug (bkz. slugs.ts) */
  pathnames: buildPathnames(),
});

export type AppLocale = (typeof routing.locales)[number];

/** RTL (sağdan sola) yazılan diller */
export const rtlLocales: AppLocale[] = ["ar"];
export const isRtl = (locale: string) => rtlLocales.includes(locale as AppLocale);

/** Dil seçicide gösterilen yerel adlar */
export const localeNames: Record<AppLocale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  hu: "Magyar",
  pl: "Polski",
  ru: "Русский",
  ar: "العربية",
};

/** country-flag-icons bayrak kodları */
export const localeFlags: Record<AppLocale, string> = {
  tr: "TR",
  en: "GB",
  de: "DE",
  es: "ES",
  it: "IT",
  hu: "HU",
  pl: "PL",
  ru: "RU",
  ar: "SA",
};

/** hreflang değerleri */
export const localeHreflang: Record<AppLocale, string> = {
  tr: "tr",
  en: "en",
  de: "de",
  es: "es",
  it: "it",
  hu: "hu",
  pl: "pl",
  ru: "ru",
  ar: "ar",
};
