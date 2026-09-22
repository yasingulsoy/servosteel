import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { routing, localeHreflang, type AppLocale } from "./routing";
import { localizeFullPath } from "./slugs";

/** og:locale — Facebook/LinkedIn dil kodu (layout ve sayfa etiketleri ortak kullanır). */
export const OG_LOCALE: Record<AppLocale, string> = {
  tr: "tr_TR",
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
  it: "it_IT",
  hu: "hu_HU",
  pl: "pl_PL",
  ru: "ru_RU",
  ar: "ar_SA",
};

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
 * `x-default` hangi dile bakar.
 *
 * Varsayılan dil Türkçe ama x-default **İngilizce**. İkisi farklı sorulara
 * cevap veriyor: varsayılan dil "kök adreste ne yayınlanıyor", x-default ise
 * "dili hiçbir sürümümüzle eşleşmeyen kullanıcıya ne gösterilsin".
 *
 * Dokuz dilimiz var; eşleşmeyen kullanıcı Fransız, Hollandalı, Japon,
 * İskandinav, Portekizli demek — yani ihracat pazarı. Ölçüm (2026-09-15,
 * 60 gün, bot ağırlıklı Direct hariç): yurt dışından gelen **164 oturum 6
 * talep** getirdi (%3,66), Türkiye'den gelen **402 oturum 1** (%0,25).
 * O kullanıcıyı Türkçe sayfaya indirmek, en iyi dönüşen kitleyi okuyamadığı
 * bir sayfaya göndermek oluyor.
 *
 * Bu, dil eşleşmesini EZMİYOR: Almanca arayan yine `/de` sayfasını alır.
 * Yalnızca hiçbir hreflang tutmadığında devreye giriyor.
 */
export const X_DEFAULT_LOCALE: AppLocale = "en";

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
  languages["x-default"] = localePath(X_DEFAULT_LOCALE, path);

  return {
    canonical: localePath(locale, path),
    languages,
  };
}

/**
 * Site paylaşım görseli — `src/app/[locale]/opengraph-image.tsx` üretir
 * (1200×630, marka renkleri). Adres dilin önekiyle: tr `/opengraph-image`,
 * diğerleri `/en/opengraph-image`. Kendi fotoğrafı olmayan sayfalar bunu alır.
 */
export function siteGorseli(locale: AppLocale) {
  return `${prefix(locale)}/opengraph-image`;
}

/**
 * Sayfanın KENDİ paylaşım etiketleri (og:*, twitter:*).
 *
 * Gerekli çünkü metadata SIĞ birleşiyor: `openGraph` bir üst katmanda
 * tanımlıysa ve sayfa kendi `openGraph`ını vermiyorsa, sayfa LAYOUT'unkini
 * olduğu gibi kullanıyordu — 2026-09-22'de canlıdaki her sayfa ana sayfanın
 * başlığıyla ve `og:url = /` ile paylaşılıyordu (LinkedIn/WhatsApp önizlemesi
 * ana sayfayı gösteriyor, paylaşım ana sayfaya yazılıyordu).
 *
 * `gorsel`: ürün sayfalarının kendi fotoğrafı (`/gorseller/{slug}.jpg`).
 * Verilmezse dosya kuralıyla gelen site görseli kalır
 * (`src/app/[locale]/opengraph-image.tsx`).
 */
/**
 * Paylaşım kopyası: sitenin kendi fotoğrafı yerine 1200×630, 50-130 KB kopya
 * (`public/paylasim/`, `python scripts/paylasim-gorselleri.py`).
 *
 * Neden: site fotoğrafları 340-780 KB ve oranları karışık; LinkedIn/WhatsApp
 * önizlemesi 1200×630 bekliyor, WhatsApp büyük dosyada önizlemeyi bazen hiç
 * göstermiyor. Kopyası olmayan adres (marka görseli, dış adres) aynen kalır.
 */
export function paylasimGorseli(gorsel: string) {
  return gorsel.startsWith("/gorseller/") ? gorsel.replace("/gorseller/", "/paylasim/") : gorsel;
}

export function sayfaMeta(
  locale: AppLocale,
  path: string,
  s: { baslik: string; aciklama: string; gorsel?: string; tur?: "website" | "article"; yayin?: string }
): Metadata {
  const gorsel = s.gorsel ? paylasimGorseli(s.gorsel) : siteGorseli(locale);
  return {
    title: pageTitle(s.baslik),
    description: s.aciklama,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: s.tur ?? "website",
      locale: OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale],
      url: localePath(locale, path),
      siteName: SITE_NAME,
      title: s.baslik,
      description: s.aciklama,
      images: [gorsel],
      ...(s.yayin ? { publishedTime: s.yayin } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: s.baslik,
      description: s.aciklama,
      images: [gorsel],
    },
  };
}
