import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { routing, localeHreflang, type AppLocale } from "./routing";
import { localizeFullPath } from "./slugs";

/** Google SERP'te başlık ~60 karakterde kesilir. */
const MAX_TITLE = 60;
const SUFFIX_LEN = ` | ${SITE_NAME}`.length;

/**
 * Sayfa başlığı: marka son eki ancak SIĞIYORSA eklenir.
 *
 * Layout'taki `template: "%s | Servosteel"` her başlığa 13 karakter bindiriyor;
 * uzun çevirilerde (İtalyanca, Macarca) bu, başlığı SERP sınırının üstüne
 * taşıyordu — ve kesilen kısım zaten markanın kendisi oluyordu. Sığmadığında
 * `absolute` döndürerek şablon atlanır: marka görünmez ama başlığın anlamlı
 * kısmı korunur. Tersi, hem markayı hem son kelimeleri kaybettiriyordu.
 */
export function pageTitle(title: string): string | { absolute: string } {
  return title.length + SUFFIX_LEN > MAX_TITLE ? { absolute: title } : title;
}

/** Locale'e göre URL öneki: tr -> "", diğerleri -> "/en" vb. */
function prefix(locale: AppLocale) {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

/**
 * Locale'li tam yol; kök için "/" döner.
 *
 * Slug'lar da çevrilir: tr Türkçe kalır, diğer diller İngilizce slug alır
 * (`/en/coil-slitting-lines`). Buradan geçen üç yer — canonical, hreflang ve
 * sitemap — next-intl `Link`'inden geçmez, mutlak URL üretir; çeviriyi bu
 * yüzden kendimiz uygulamak zorundayız. Aksi halde hreflang var olmayan
 * adreslere işaret ederdi.
 *
 * `path` her zaman DAHİLİ (Türkçe) yoldur: "/dilme-hatlari", "/makineler/rulo-acicilar".
 */
export function localePath(locale: AppLocale, path: string) {
  return `${prefix(locale)}${localizeFullPath(path, locale)}` || "/";
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
