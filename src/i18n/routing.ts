import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "de", "es", "it", "hu", "pl", "ru"],
  defaultLocale: "tr",
  /* tr kökte yaşar (/), diğer diller prefix alır (/en, /ru ...) */
  localePrefix: "as-needed",
  /* Otomatik dil algılama kapalı: / her zaman Türkçe açılır, dili kullanıcı seçer.
     true yapılırsa tarayıcı diline göre otomatik yönlendirme olur. */
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

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
};
