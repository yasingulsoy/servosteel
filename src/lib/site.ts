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
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Karşılaştırma HOST üzerinden yapılır (protokol ve "www." yok sayılır).
 * Tam string eşleşmesi kullanılsaydı, canlıda yanlışlıkla "www." veya "http://"
 * yazılması TÜM siteyi sessizce noindex yapardı — bu sessiz felaket engellenir.
 */
export const IS_PRODUCTION_SITE = hostOf(SITE_URL) === hostOf(PRODUCTION_URL);

/**
 * GA4 ölçüm kimliği. Ortam değişkeni DEĞİL, bilerek sabit.
 *
 * Bu değer gizli değil — her ziyaretçi sayfa kaynağında görüyor. Env'e konursa
 * `NEXT_PUBLIC_*` değişkenleri derleme anında koda gömüldüğü için "build bu
 * değeri aldı mı" belirsizliği doğar; cutover günü tam bunu yaşadık. Sabit
 * olunca depoda ne varsa canlıda o çalışır.
 *
 * Yalnızca IS_PRODUCTION_SITE iken yüklenir (bkz. components/analytics.tsx):
 * önizleme kopyaları gerçek veriyi kirletmesin.
 */
export const GA_MEASUREMENT_ID = "G-FFES4VQED3";

/**
 * Microsoft Clarity proje kimliği — ısı haritası ve oturum kaydı.
 *
 * Neden eklendi: GA4 "kaç oturum" diyor ama "neden dönüşmüyor" demiyor.
 * 14 günde ~70 oturumda tek `form_start`, sıfır tamamlanma var; Clarity
 * kaydırma derinliği, ölü/öfke tıklaması ve oturum kaydıyla bunun sebebini
 * gösterebilecek tek ücretsiz araç.
 *
 * GA_MEASUREMENT_ID ile aynı gerekçeyle sabit, env değil.
 */
export const CLARITY_PROJECT_ID = "xzdxkpw7qv";

export const SITE_NAME = "Servosteel";

export const SITE_TITLE =
  "Servosteel | Roll Form, Rulo Dilme ve Boy Kesme Hatları";

export const SITE_DESCRIPTION =
  "Roll form hatları, rulo dilme hatları, boy kesme hatları ve pres besleme sistemlerinde müşteriye özel tasarım ve üretim. İstanbul'dan 48+ ülkeye ihracat.";

export const CONTACT = {
  phoneDisplay: "+90 216 415 30 05",
  phoneHref: "tel:+902164153005",
  /* Eski sitedeki NAP kaydından — parite için korunuyor */
  faxDisplay: "+90 216 415 30 06",
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
