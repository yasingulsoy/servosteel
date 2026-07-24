import type { Metadata } from "next";
import { routing, localeHreflang, type AppLocale } from "./routing";

/** Locale'e göre URL öneki: tr -> "", diğerleri -> "/en" vb. */
function prefix(locale: AppLocale) {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

/** Locale'li tam yol; kök için "/" döner */
export function localePath(locale: AppLocale, path: string) {
  return `${prefix(locale)}${path}` || "/";
}

/**
 * Sayfa başına canonical + hreflang alternates üretir.
 * path: locale'siz yol ("" veya "/dilme-hatlari" gibi)
 */
export function pageAlternates(
  locale: AppLocale,
  path: string
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[localeHreflang[l]] = localePath(l, path);
  }
  languages["x-default"] = localePath(routing.defaultLocale, path);

  return {
    canonical: localePath(locale, path),
    languages,
  };
}
