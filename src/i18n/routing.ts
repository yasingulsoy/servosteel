import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "de", "es", "it", "hu", "pl", "ru", "ar"],
  defaultLocale: "tr",
  /* tr kökte yaşar (/), diğer diller prefix alır (/en, /ru, /ar ...) */
  localePrefix: "as-needed",
  /* Otomatik dil algılama kapalı: / her zaman Türkçe açılır, dili kullanıcı seçer. */
  localeDetection: false,
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
