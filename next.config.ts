import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { localizeFullPath } from "./src/i18n/slugs";

const withNextIntl = createNextIntlPlugin();

/**
 * Eski WordPress sitesinden (servosteel.com.tr) yeni yapıya kalıcı yönlendirmeler.
 * permanent: true => 308 (SEO'da 301'e denk; HTTP metodunu korur, arama motorları kalıcı sayar).
 * Eski site tek dilli İngilizce olduğundan hedefler /en/* — İngilizce sıralamalar korunur.
 *
 * ÖNEMLİ: Eski site her ürün için İKİ URL tutuyordu — `/product/{slug}/` ve üst seviye
 * `/{slug}/` (ikincisi sitemap'te yoktu ama indekslenmiş ve 301 veriyordu). Bu yüzden
 * her ürün slug'ı için iki varyant da kaydedilir; aksi halde cutover'da 404 olurlardı.
 *
 * EĞİK ÇİZGİ: Eski URL'lerin tamamı `/` ile bitiyor, kaynaklar ise çizgisiz yazılı.
 * Next önce çizgiyi kırpar (308), sonra buradaki kural çalışır (308) — yani her eski
 * URL 2 adımda hedefe varır. Kaynağa `/` eklemek DENENDİ, hiçbir etkisi yok: kırpma
 * custom redirect'lerden önce çalışıyor. Tek alternatif skipTrailingSlashRedirect,
 * o da `/yol` ve `/yol/` adreslerinin ikisini birden 200 yapıp yinelenen içerik
 * üretirdi — 2 adımlık zincirden kötü. Zincir bilerek bırakıldı.
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

/**
 * --- tr.servosteel.com.tr'nin TÜRKÇE slug'ları ---
 *
 * Aşağıdaki `tr.*` host kuralı yolu koruyarak köke yönlendiriyor ve oradaki
 * "ikinci adımda WordPress kuralları yakalar" varsayımıyla yazılmıştı. O
 * varsayım YANLIŞTI: `tr.` kopyası Türkçe slug kullanıyordu
 * (`/product/hidrolik-rulo-acicilar`), ana site İngilizce
 * (`/product/hydraulic-decoilers`). Hiçbir kural eşleşmediği için 301 -> 404
 * zinciri oluşuyordu.
 *
 * Search Console'un 16 aylık penceresinde bu şekilde 404'e düşen 19 URL vardı;
 * en büyüğü `/iletisime/` (50 gösterim, ortalama 4,5. sıra). Liste GSC'den
 * geldiği için yalnızca gösterim ALMIŞ adresleri kapsar — kalanları en sondaki
 * genel yakalayıcı topluyor.
 *
 * Hedefler Türkçe (önek yok, tr varsayılan dil): bu adreslere gelen kullanıcı
 * Türkçe arama yapmış, İngilizce sayfaya atmak dil değiştirmek olurdu.
 */
const TR_DECOILERS = [
  "hidrolik-rulo-acicilar",
  "mekanik-rulo-acicilar",
  ...[6, 8, 10, 12, 15, 20].map((t) => `${t}-ton-hidrolik-rulo-acici`),
  ...[500, 750, 1500, 2500].map((k) => `${k}-kg-mekanik-rulo-acici`),
];

const TR_SERVO = ["kasali-servo-suruculer", "servo-suruculer", "mini-servo-suruculer"];
const TR_STRAIGHTENERS = [
  "kasali-dogrultmali-servo-suruculer",
  "dogrultmali-servo-suruculer",
  "mini-dogrultmali-servo-suruculer",
];

/* Türkçe roll-form slug'ı -> yeni site slug'ı.
   `cable-tray-production-lineakablo-...`: WordPress'te iki başlık birleşmiş,
   bozuk hâliyle indekslenmiş — GSC'de göründüğü için birebir korunuyor. */
const TR_ROLLFORM: Record<string, string> = {
  "solar-profil-uretim-hatti": "solar-profil",
  "agir-raf-uretim-hatti": "agir-raf",
  "iskele-kalas-uretim-hatti": "iskele-kalas",
  "kablo-kanali-uretim-hatti": "kablo-kanali",
  "cable-tray-production-lineakablo-kanali-uretim-hatti": "kablo-kanali",
  "yol-bariyeri-uretim-hatti": "yol-bariyeri",
  "gurultu-bariyeri-uretim-hatti": "gurultu-bariyeri",
  "c-sigma-omega-profil-uretim-hatti": "c-sigma-omega",
};

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

/**
 * Dahili (Türkçe) yolu İngilizce hedefe çevirir: "/makineler/rulo-acicilar"
 * -> "/en/machines/decoilers".
 *
 * Hedefler elle yazılmıyor; slug tablosundan (src/i18n/slugs.ts) türetiliyor.
 * Aksi halde bir slug değiştiğinde 50 yönlendirmenin hedefi sessizce 404'e
 * düşerdi — üstelik bunu ancak Search Console'da haftalar sonra görürdük.
 */
const en = (path: string) => `/en${localizeFullPath(path, "en")}`;

const M = en("/makineler");

const nextConfig: NextConfig = {
  /* React ViewTransition entegrasyonu — rota geçişlerinde içerik yumuşakça
     akar (globals.css'teki ::view-transition kuralları). Desteklemeyen
     tarayıcıda hiçbir şey olmaz, sayfa normal değişir. */
  experimental: {
    viewTransition: true,
  },

  images: {
    /* Next varsayılanı yalnızca WebP'dir. AVIF tipik olarak WebP'nin de
       %20-30 altına iner; sıra önemli — tarayıcı ilk desteklediğini alır. */
    formats: ["image/avif", "image/webp"],
    /* YouTube önizleme görselleri (videolar sayfası) */
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },

  /**
   * Güvenlik başlıkları. Next bunları kendiliğinden eklemez.
   *
   * Content-Security-Policy BİLEREK eklenmedi: sayfalarda JSON-LD ve tema
   * başlangıç script'i satır içi çalışıyor, YouTube/Google Maps iframe'leri
   * ve Google Fonts dışarıdan yükleniyor. Bunları kapsayan bir CSP
   * 'unsafe-inline' gerektirir ve o hâliyle koruma değeri neredeyse sıfırdır;
   * nonce'lu doğru çözüm ise statik üretimi bozar. Yanlış güvenlik hissi
   * vermektense eklenmedi — ihtiyaç doğarsa nonce mimarisiyle kurulmalı.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          /* Sayfanın başka sitede iframe'e gömülmesini engeller (clickjacking) */
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          /* Tarayıcının içerik tipini tahmin etmesini kapatır */
          { key: "X-Content-Type-Options", value: "nosniff" },
          /* Dış sitelere yalnızca origin sızar, tam URL değil */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* Kullanılmayan güçlü API'ler kapalı */
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          /* HTTPS zorunlu — tarayıcı HTTP üzerinden gelirse yok sayar */
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      /**
       * --- Alan adı: www -> kök. HER ŞEYDEN ÖNCE. ---
       *
       * Bugün bu yönlendirmeyi eski WordPress hosting'i yapıyor (301, canonical
       * non-www). Yeni sunucuya taşınınca o ayar GELMEZ ve iki alan adı da
       * içerik sunmaya başlar. Ajans rapor ettiği sıralamaları
       * www.servosteel.com.tr üzerinde ölçüyor; kural buraya alınmazsa cutover
       * anında hem yinelenen içerik hem sıralama kaybı riski doğar.
       *
       * Platform (Vercel/Cloudflare) bunu zaten yapıyorsa kural hiç
       * tetiklenmez — çift yönlendirme veya döngü oluşmaz, çünkü hedef mutlak
       * URL ve www host'u bir daha görünmez.
       */
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www.servosteel.com.tr" }],
        destination: "https://servosteel.com.tr/:path*",
        permanent: true,
      },

      /**
       * --- Alan adı: tr.* alt alan adı -> kök. ---
       *
       * cPanel zone'unda `tr.servosteel.com.tr` diye ikinci bir WordPress
       * kurulumu çıktı: 52 URL, ana sitenin (50 URL) neredeyse birebir kopyası,
       * ürün slug'ları aynı (`/product/hydraulic-decoilers/` vb.). Üstelik
       * `robots: index, follow` ve canonical KENDİNE bakıyor — yani Google'a
       * "asıl benim" diyor. İki kopya aynı dilde, aynı ürünlerle indekste
       * yarışıyordu.
       *
       * Yol korunarak yönlendiriliyor: slug'lar aynı olduğu için ikinci adımda
       * aşağıdaki WordPress -> yeni site kuralları devreye giriyor ve sayfa
       * doğru yere iniyor. Varsa backlink'ler de kök alan adına akar.
       *
       * Yalnızca WEB yönlendiriliyor. `tr.` alt alan adının kendi mail
       * kayıtları (ayrı DKIM anahtarı, ayrı SPF) DNS'te duruyor ve bu kural
       * onlara dokunmaz.
       */
      ...["tr.servosteel.com.tr", "www.tr.servosteel.com.tr"].map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://servosteel.com.tr/:path*",
        permanent: true,
      })),

      /* --- Eski Yoast sitemap'leri -> yeni sitemap ---
         Google eski sitemap adreslerini aylarca istemeye devam eder; 404
         yerine yenisine yönlendirmek yeniden taramayı hızlandırır. */
      ...[
        "/sitemap_index.xml",
        "/wp-sitemap.xml",
        "/post-sitemap.xml",
        "/page-sitemap.xml",
        "/product-sitemap.xml",
        "/category-sitemap.xml",
        "/product_cat-sitemap.xml",
        "/author-sitemap.xml",
      ].map((s) => p(s, "/sitemap.xml")),

      /**
       * --- Kaldırılan ürün: kalıp ve merdane ---
       *
       * Firma bu ürünü portföyden çıkardı. Sayfa silindi ama indekslenmiş
       * adresler bir süre daha istenmeye devam eder; 404 yerine makine
       * listesine gönderiliyor. Dokuz dilin tamamı için tek kural yeterli
       * değil — locale önekli varyantlar ayrıca yakalanır.
       */
      /* Türkçe kökten gelen istek Türkçe listeye gitmeli — `M` İngilizce hedef
         olduğu için burada kullanılamaz, dil değiştirmiş olurduk. */
      p("/makineler/kalip-ve-merdane", "/makineler"),
      p("/:locale(en|de|es|it|hu|pl|ru|ar)/machines/dies-and-rollers", "/:locale/machines"),

      /* --- WordPress artıkları (canlıda 200 dönüyorlar, yenide 404 olurlardı) --- */
      p("/author/:slug", "/en"),
      p("/feed", "/en"),
      p("/comments/feed", "/en"),
      p("/:path*/feed", "/en"),

      /* --- Makineler --- */
      ...many(DECOILERS, en("/makineler/rulo-acicilar")),
      p("/decoiler", en("/makineler/rulo-acicilar")),
      p("/decoilers", en("/makineler/rulo-acicilar")),
      p("/product-category/machines/decoilers", en("/makineler/rulo-acicilar")),
      p("/product-category/machines/decoilers/hydraulic-decoilers", en("/makineler/rulo-acicilar")),
      p("/product-category/machines/decoilers/mechanical-decoilers", en("/makineler/rulo-acicilar")),

      ...many(SERVO_FEEDERS, en("/makineler/servo-suruculer")),
      p("/servo-feeder", en("/makineler/servo-suruculer")),
      p("/feeding-machines", en("/makineler/servo-suruculer")),
      p("/product-category/machines/feeding-machines", en("/makineler/servo-suruculer")),

      ...many(STRAIGHTENERS, en("/makineler/dogrultmali-servo-suruculer")),
      ...many(["compact-lines"], en("/makineler/kompakt-hatlar")),

      /* --- Hatlar --- */
      ...many(["coil-slitting-lines"], en("/dilme-hatlari")),
      p("/coil-slitting-line", en("/dilme-hatlari")),
      ...many(["cut-to-length-line"], en("/boy-kesme-hatlari")),

      ...many(["roll-forming-line"], en("/roll-form-hatlari")),
      p("/roll-forming-lines", en("/roll-form-hatlari")),
      p("/product-category/roll-forming-lines", en("/roll-form-hatlari")),
      p("/product-category/machines/lines", en("/roll-form-hatlari")),

      /* --- Roll-form alt hatları (birebir) --- */
      ...Object.entries(ROLLFORM).flatMap(([old, slug]) =>
        both(old).map((s) => p(s, en(`/roll-form-hatlari/${slug}`)))
      ),

      /* --- Bilgi sayfaları ---
         Eski slug'lar yeni İngilizce slug'larla AYNI ("/about-us" -> "/en/about-us").
         Döngü olmaz: kaynak kök seviyede, hedef /en altında. */
      p("/about-us", en("/hakkimizda")),
      p("/contact-us", en("/iletisim")),
      /* www.servosteel.com.tr/contact/ — 25 gösterim, ort. 4,7. sıra, 404'tü */
      p("/contact", en("/iletisim")),

      /* --- tr.* kopyasının Türkçe slug'ları (bkz. TR_* tabloları) --- */
      ...many(TR_DECOILERS, "/makineler/rulo-acicilar"),
      p("/rulo-acicilar", "/makineler/rulo-acicilar"),
      ...many(TR_SERVO, "/makineler/servo-suruculer"),
      ...many(TR_STRAIGHTENERS, "/makineler/dogrultmali-servo-suruculer"),
      ...Object.entries(TR_ROLLFORM).flatMap(([eski, slug]) =>
        both(eski).map((s) => p(s, `/roll-form-hatlari/${slug}`))
      ),
      /* Türkçe kategori ağacı */
      p("/product-category/makineler", "/makineler"),
      p("/product-category/makineler/:alt*", "/makineler"),
      p("/urunler", "/makineler"),
      /* En çok gösterim alan kırık adres: 50 gösterim, ort. 4,5. sıra */
      p("/iletisime", "/iletisim"),
      p("/hakkimizda-2", "/hakkimizda"),

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
      /* Mağaza sayfalama: /shop/page/2, /3 ... (404'tü) */
      p("/shop/page/:n*", `${M}`),

      /**
       * --- GENEL YAKALAYICI — HER ZAMAN EN SONDA ---
       *
       * Yukarıdaki kuralların hiçbiri tutmayan eski WordPress ürün adresleri
       * buraya düşer. Gerekli çünkü kırık adres listesi Search Console'dan
       * geliyor ve GSC yalnızca son 16 ayda GÖSTERİM ALMIŞ adresleri bilir;
       * eski `tr.` kopyasında gösterim almamış ama backlink'i ya da indeks
       * kaydı olan slug'lar bu listede yok. Onlar da 404 yerine makine
       * listesine iner.
       *
       * Sırası kritik: Next yönlendirmeleri sırayla dener, ilk eşleşen kazanır.
       * Bu kural yukarı taşınırsa üstündeki tüm özel ürün kuralları ölür.
       *
       * Hedef Türkçe: eşleşmeyen slug'ların kaynağı büyük olasılıkla `tr.`
       * kopyasıdır — ana sitenin İngilizce ürünlerinin tamamı zaten yukarıda
       * tek tek karşılanıyor (arşivdeki 18 ürünün hepsi).
       */
      p("/product/:slug", "/makineler"),
      p("/product-category/:path*", "/makineler"),

      /* ---- ESKİ WORDPRESS BÖLÜM KÖKLERİ ----
       *
       * Tarama istatistiklerinde isteklerin %13,2'si 404 dönüyor. Bu adresler
       * eski sitenin bölüm kökleri; canlıda tek tek denendi ve hepsi 404
       * veriyor. Hangi adreslerin gerçekten tarandığını GSC'nin 404 örnek
       * listesi söyler, ama bunlar tipik WordPress yapısı ve karşılıkları belli
       * — eşleşme olmazsa kural zaten hiç çalışmaz, yanlış tarafa gitme riski
       * yok.
       *
       * `/wp-admin`, `/wp-includes`, `/xmlrpc.php`, `/wp-json` BİLEREK dışarıda:
       * onlar WordPress iç dosyaları, artık yoklar ve 404 dönmeleri DOĞRU olan.
       * Yönlendirmek, olmayan bir şeye "buradaydı" demek olurdu.
       */
      p("/blog", "/akademi"),
      p("/blog/:path*", "/akademi"),
      p("/haberler", "/akademi"),
      p("/haberler/:path*", "/akademi"),
      p("/products", "/makineler"),
      p("/products/:path*", "/makineler"),
      p("/services", "/makineler"),
      p("/services/:path*", "/makineler"),
      p("/hizmetler", "/makineler"),
      p("/hizmetler/:path*", "/makineler"),
      /* Etiket ve yıl arşivleri: eski blogun listeleme sayfaları, karşılığı
         akademi. İçerik eşleşmesi yok, bölüm eşleşmesi var. */
      p("/tag/:path*", "/akademi"),
      p("/2023/:path*", "/akademi"),
      p("/2024/:path*", "/akademi"),
      p("/2025/:path*", "/akademi"),
    ];
  },
};

export default withNextIntl(nextConfig);
