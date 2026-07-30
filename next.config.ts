import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/**
 * Eski WordPress sitesinden (servosteel.com.tr) yeni yapıya kalıcı yönlendirmeler.
 * permanent: true => 308 (SEO'da 301'e denk; HTTP metodunu korur, arama motorları kalıcı sayar).
 * Eski site tek dilli İngilizce olduğundan hedefler /en/* — İngilizce sıralamalar korunur.
 *
 * ÖNEMLİ: Eski site her ürün için İKİ URL tutuyordu — `/product/{slug}/` ve üst seviye
 * `/{slug}/` (ikincisi sitemap'te yoktu ama indekslenmiş ve 301 veriyordu). Bu yüzden
 * her ürün slug'ı için iki varyant da kaydedilir; aksi halde cutover'da 404 olurlardı.
 */
const p = (source: string, destination: string) => ({ source, destination, permanent: true });

/** Bir ürün slug'ının hem /product/{slug} hem üst seviye /{slug} varyantını üretir. */
const both = (slug: string) => [`/product/${slug}`, `/${slug}`];

/* slug listesi -> tek hedef */
const many = (slugs: string[], destination: string) =>
  slugs.flatMap(both).map((s) => p(s, destination));

/* Rulo açıcılar (tüm ton/kg varyantları tek sayfada toplanır) */
const DECOILERS = [
  "hydraulic-decoilers",
  "mechanical-decoilers",
  "6-ton-hydraulic-decoiler",
  "8-ton-hydraulic-decoiler",
  "10-ton-hydraulic-decoiler",
  "12-ton-hydraulic-decoiler",
  "15-ton-hydraulic-decoiler",
  "20-ton-hydraulic-decoiler",
  "500-kg-mechanical-decoiler",
  "750-kg-mechanical-decoiler",
  "1500-kg-mechanical-decoiler",
  "2500-kg-mechanical-decoiler",
];

const SERVO_FEEDERS = ["servo-feeders", "mini-servo-feeders"];
const STRAIGHTENERS = ["straightener-servo-feeders", "mini-straightener-servo-feeders"];

/* Roll-form alt hatları: eski slug -> yeni slug (birebir eşleşir) */
const ROLLFORM: Record<string, string> = {
  "cable-tray-production-line": "kablo-kanali",
  "solar-panel-profile-production-line": "solar-profil",
  "storage-rack-production-line": "agir-raf",
  "scaffolding-production-line": "iskele-kalas",
  "guard-rail-production-line": "yol-bariyeri",
  "noise-barrier-production-line": "gurultu-bariyeri",
  "c-and-sigma-and-omega-profiles-production-line": "c-sigma-omega",
};

const M = "/en/makineler";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      /* --- Makineler --- */
      ...many(DECOILERS, `${M}/rulo-acicilar`),
      p("/decoiler", `${M}/rulo-acicilar`),
      p("/decoilers", `${M}/rulo-acicilar`),
      p("/product-category/machines/decoilers", `${M}/rulo-acicilar`),
      p("/product-category/machines/decoilers/hydraulic-decoilers", `${M}/rulo-acicilar`),
      p("/product-category/machines/decoilers/mechanical-decoilers", `${M}/rulo-acicilar`),

      ...many(SERVO_FEEDERS, `${M}/servo-suruculer`),
      p("/servo-feeder", `${M}/servo-suruculer`),
      p("/feeding-machines", `${M}/servo-suruculer`),
      p("/product-category/machines/feeding-machines", `${M}/servo-suruculer`),

      ...many(STRAIGHTENERS, `${M}/dogrultmali-servo-suruculer`),
      ...many(["compact-lines"], `${M}/kompakt-hatlar`),

      /* --- Hatlar --- */
      ...many(["coil-slitting-lines"], "/en/dilme-hatlari"),
      p("/coil-slitting-line", "/en/dilme-hatlari"),
      ...many(["cut-to-length-line"], "/en/boy-kesme-hatlari"),

      ...many(["roll-forming-line"], "/en/roll-form-hatlari"),
      p("/roll-forming-lines", "/en/roll-form-hatlari"),
      p("/product-category/roll-forming-lines", "/en/roll-form-hatlari"),
      p("/product-category/machines/lines", "/en/roll-form-hatlari"),

      /* --- Roll-form alt hatları (birebir) --- */
      ...Object.entries(ROLLFORM).flatMap(([old, slug]) =>
        both(old).map((s) => p(s, `/en/roll-form-hatlari/${slug}`))
      ),

      /* --- Bilgi sayfaları --- */
      p("/about-us", "/en/hakkimizda"),
      p("/contact-us", "/en/iletisim"),

      /* --- Katalog / mağaza --- */
      p("/product-category/machines", `${M}`),
      p("/shop", `${M}`),

      /* --- Genel kategoriler ve WP çöpü --- */
      p("/lines", "/en"),
      p("/product-category/main", "/en"),
      p("/product-category/uncategorized", "/en"),
      p("/category/uncategorized", "/en"),
      p("/hello-world", "/en"),

      /* --- WooCommerce fonksiyonel sayfalar (SEO değeri yok) --- */
      p("/cart", "/en"),
      p("/checkout", "/en"),
      p("/my-account", "/en"),
    ];
  },
};

export default withNextIntl(nextConfig);
