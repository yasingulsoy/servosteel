import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/**
 * Eski WordPress sitesinden (servosteel.com.tr) yeni yapıya kalıcı yönlendirmeler.
 * permanent: true => 308 (SEO'da 301'e denk; HTTP metodunu korur, arama motorları kalıcı sayar).
 * Eski site tek dilli İngilizce olduğundan hedefler /en/* — İngilizce sıralamalar korunur.
 * Kaynaklar sondaki "/" olmadan yazılır; Next gelen "/eski-url/" isteğini normalize eder.
 */
const p = (source: string, destination: string) => ({ source, destination, permanent: true });

/* Tüm açıcı (decoiler) varyantları -> tek makine sayfası */
const toDecoiler = [
  "/decoilers",
  "/product-category/machines/decoilers",
  "/product-category/machines/decoilers/hydraulic-decoilers",
  "/product-category/machines/decoilers/mechanical-decoilers",
  "/product/hydraulic-decoilers",
  "/product/mechanical-decoilers",
  "/product/6-ton-hydraulic-decoiler",
  "/product/8-ton-hydraulic-decoiler",
  "/product/10-ton-hydraulic-decoiler",
  "/product/12-ton-hydraulic-decoiler",
  "/product/15-ton-hydraulic-decoiler",
  "/product/20-ton-hydraulic-decoiler",
  "/product/500-kg-mechanical-decoiler",
  "/product/750-kg-mechanical-decoiler",
  "/product/1500-kg-mechanical-decoiler",
  "/product/2500-kg-mechanical-decoiler",
];

/* Servo besleyiciler */
const toServoFeeder = [
  "/feeding-machines",
  "/product-category/machines/feeding-machines",
  "/product/servo-feeders",
  "/product/mini-servo-feeders",
];

/* Doğrultmalı servo besleyiciler */
const toStraightenerFeeder = [
  "/product/straightener-servo-feeders",
  "/product/mini-straightener-servo-feeders",
];

/* Roll-form alt hatları (birebir eşleşen) : eski URL -> yeni slug */
const rollform: Record<string, string> = {
  "/product/cable-tray-production-line": "kablo-kanali",
  "/product/solar-panel-profile-production-line": "solar-profil",
  "/product/storage-rack-production-line": "agir-raf",
  "/product/scaffolding-production-line": "iskele-kalas",
  "/product/guard-rail-production-line": "yol-bariyeri",
  "/product/noise-barrier-production-line": "gurultu-bariyeri",
  "/product/c-and-sigma-and-omega-profiles-production-line": "c-sigma-omega",
};

const nextConfig: NextConfig = {
  async redirects() {
    return [
      /* Açıcılar */
      ...toDecoiler.map((s) => p(s, "/en/makineler/rulo-acicilar")),
      /* Servo besleyiciler */
      ...toServoFeeder.map((s) => p(s, "/en/makineler/servo-suruculer")),
      /* Doğrultmalı besleyiciler */
      ...toStraightenerFeeder.map((s) => p(s, "/en/makineler/dogrultmali-servo-suruculer")),
      /* Kompakt hatlar */
      p("/product/compact-lines", "/en/makineler/kompakt-hatlar"),
      /* Roll-form alt hatları (birebir) */
      ...Object.entries(rollform).map(([s, slug]) => p(s, `/en/roll-form-hatlari/${slug}`)),
      /* Ana hatlar */
      p("/roll-forming-lines", "/en/roll-form-hatlari"),
      p("/product/roll-forming-line", "/en/roll-form-hatlari"),
      p("/product-category/roll-forming-lines", "/en/roll-form-hatlari"),
      p("/product-category/machines/lines", "/en/roll-form-hatlari"),
      p("/product/coil-slitting-lines", "/en/dilme-hatlari"),
      p("/product/cut-to-length-line", "/en/boy-kesme-hatlari"),
      /* Bilgi sayfaları */
      p("/about-us", "/en/hakkimizda"),
      p("/contact-us", "/en/iletisim"),
      /* Makine kataloğu / mağaza -> makineler hub */
      p("/product-category/machines", "/en/makineler"),
      p("/shop", "/en/makineler"),
      /* Genel kategoriler ve WP çöpü -> İngilizce ana sayfa */
      p("/lines", "/en"),
      p("/product-category/main", "/en"),
      p("/product-category/uncategorized", "/en"),
      p("/category/uncategorized", "/en"),
      p("/hello-world", "/en"),
      /* WooCommerce fonksiyonel sayfalar (SEO değeri yok) */
      p("/cart", "/en"),
      p("/checkout", "/en"),
      p("/my-account", "/en"),
    ];
  },
};

export default withNextIntl(nextConfig);
