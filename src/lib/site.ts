/** Site geneli sabitler — SEO, JSON-LD ve sitemap tek yerden beslenir */

/** Gerçek canlı adres. Yalnızca burası arama motorlarına açıktır. */
export const PRODUCTION_URL = "https://servosteel.com.tr";

/**
 * Site kök adresi. Ortam değişkeninden okunur; yoksa canlı adrese düşer.
 * NEXT_PUBLIC_ önekli, çünkü bu dosya client bileşenlerinden de import ediliyor.
 * Sondaki "/" temizlenir — SITE_URL her yerde `${SITE_URL}/yol` şeklinde birleştiriliyor.
 */
const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
export const SITE_URL = envSiteUrl || PRODUCTION_URL;

/**
 * Demo / önizleme kopyaları arama motorlarına KAPALI olmalıdır.
 * Aksi halde aynı içerik iki domainde indekslenir ve canlı site kendi kopyasıyla yarışır.
 * Canlıya geçerken NEXT_PUBLIC_SITE_URL=https://servosteel.com.tr yapılması (veya hiç
 * tanımlanmaması) yeterlidir — indeksleme kendiliğinden açılır.
 */
export const IS_PRODUCTION_SITE = SITE_URL === PRODUCTION_URL;
export const SITE_NAME = "Servosteel";

export const SITE_TITLE =
  "Servosteel | Roll Form, Rulo Dilme ve Boy Kesme Hatları";

export const SITE_DESCRIPTION =
  "Roll form hatları, rulo dilme hatları, boy kesme hatları ve pres besleme sistemlerinde müşteriye özel tasarım ve üretim. İstanbul'dan 48+ ülkeye ihracat.";

export const CONTACT = {
  phoneDisplay: "+90 216 415 30 05",
  phoneHref: "tel:+902164153005",
  email: "info@servosteel.com.tr",
  addressStreet: "Yunusemre Mah. İskenderpaşa Cad. 21/1",
  addressLocality: "Sancaktepe",
  addressRegion: "İstanbul",
  addressCountry: "TR",
};

export const SOCIAL_URLS = [
  "https://www.instagram.com/servosteel_turkey/",
  "https://www.linkedin.com/company/servosteel.tr/",
  "https://www.youtube.com/@ServoSteel.ServoMold",
  "https://x.com/servosteel_tr",
];
