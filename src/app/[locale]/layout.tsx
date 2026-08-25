import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Montserrat, Cairo } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactFloat } from "@/components/contact-float";
import { ViewTransition } from "@/components/view-transition";
import { PointerGlow } from "@/components/pointer-glow";
import { PageAttention } from "@/components/page-attention";
import { Analytics } from "@/components/analytics";
import { routing, isRtl, type AppLocale } from "@/i18n/routing";
import { pageAlternates } from "@/i18n/seo";
import { CONTACT, SITE_NAME, SITE_URL, SOCIAL_URLS, IS_PRODUCTION_SITE } from "@/lib/site";
import "../globals.css";

/* FONTLAR — alt küme başına bir preload etiketi basılır (next/font/google).
   Yani `subsets` içine yazılan her şey, o alt kümeyi hiç kullanmayan dillerde
   de indirilir. Türkçe bir sayfada Kiril ve Arapça dosyaları inip hiç
   kullanılmıyordu; tarayıcı konsolu bunu "preloaded but not used" diye
   bildiriyordu. Çözüm: yalnızca dokuz dilin sekizinde geçerli olan latin
   kümeleri preload edilir, diğerleri kendi dillerinde talep üzerine yüklenir. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

/* Kiril: yalnızca /ru. preload kapalı — açık kalırsa Next diğer sekiz dilde de
   etiketi basar. Rusça sayfada dosya yine iniyor, sadece bir tur geç. */
const interCyrillic = Inter({
  variable: "--font-inter",
  subsets: ["cyrillic", "latin", "latin-ext"],
  preload: false,
});

const montserratCyrillic = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin", "latin-ext"],
  weight: ["600", "700", "800"],
  preload: false,
});

/* Arapça için ayrı font — Inter/Montserrat Arapça glif içermez. RTL'de devreye
   girer, yani dokuz dilin birinde; preload aynı gerekçeyle kapalı. */
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const ogLocaleMap: Record<string, string> = {
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

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: `%s | ${SITE_NAME}`,
    },
    description: t("description"),
    alternates: pageAlternates(locale as AppLocale, ""),
    openGraph: {
      type: "website",
      locale: ogLocaleMap[locale] ?? "tr_TR",
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
      siteName: SITE_NAME,
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    /* Demo/önizleme kopyaları indekslenmez; yalnızca canlı domain aramaya açıktır. */
    robots: IS_PRODUCTION_SITE
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    /* Arama motoru site sahipliği doğrulaması — .env.local'de tanımlıysa basılır */
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined,
      other: process.env.BING_SITE_VERIFICATION?.trim()
        ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION.trim() }
        : undefined,
    },
  };
}

/* Site varsayılanı açık mod olduğu için tarayıcı çubuğu da beyaz */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

/* Varsayılan açık mod; yalnızca kullanıcı koyuyu seçtiyse .dark uygulanır (FOUC önlemi) */
const themeInit = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  /* "Üretici mi, tedarikçi mi?" belirsizliğini şema düzeyinde de kapatır. */
  description:
    "Servosteel; roll form hatları, rulo dilme hatları, boy kesme hatları, pres besleme sistemleri ve progresif pres kalıplarını müşteriye özel tasarlayan, kendi tesisinde üreten ve anahtar teslim devreye alan bir Türk makine üreticisidir. Çelik tedarikçisi değil, makine imalatçısıdır.",
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo-full.png`,
  },
  areaServed: "Worldwide",
  knowsAbout: [
    "Roll forming machinery",
    "Coil slitting lines",
    "Cut-to-length lines",
    "Servo feeders",
    "Press feeding systems",
    "Progressive press dies",
    "Coil processing",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.addressStreet,
    addressLocality: CONTACT.addressLocality,
    addressRegion: CONTACT.addressRegion,
    addressCountry: CONTACT.addressCountry,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+90-216-415-30-05",
      faxNumber: "+90-216-415-30-06",
      email: CONTACT.email,
      contactType: "sales",
      areaServed: "Worldwide",
      availableLanguage: ["Turkish", "English", "German", "Spanish", "Italian", "Hungarian", "Polish", "Russian", "Arabic"],
    },
  ],
  sameAs: SOCIAL_URLS,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  /* Aynı CSS değişkenini iki örnek tanımlıyor; sayfa başına yalnızca biri
     uygulanır. Rusça Kiril gliflerini taşıyan sürümü alır, kalan sekiz dil
     latin sürümünü. --font-arabic yalnızca RTL'de basılır. */
  const rtl = isRtl(locale);
  const kiril = locale === "ru";
  const govde = kiril ? interCyrillic : inter;
  const baslik = kiril ? montserratCyrillic : montserrat;
  /* Arapça'da Cairo hem gövdeyi hem başlığı karşılıyor; Inter ve Montserrat
     tek karakter bile basmıyor, o yüzden değişkenleri hiç uygulanmıyor. */
  const fontlar = rtl
    ? cairo.variable
    : `${govde.variable} ${baslik.variable}`;

  return (
    <html
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${fontlar} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* JS yoksa giriş animasyonları hiç tetiklenmez ve [data-reveal] içeriği
            opacity:0'da kalır — yani sayfanın büyük kısmı görünmez olur.
            Animasyonu iptal edip her şeyi son hâline sabitliyoruz. */}
        <noscript>
          <style>{`[data-reveal],[data-reveal-group]>*{opacity:1!important;translate:none!important;scale:1!important}`}</style>
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <NextIntlClientProvider>
          <SiteHeader />
          {/* Rota değişiminde içerik yumuşakça akar; header sabit kalır
              (globals.css ::view-transition kuralları). */}
          <main className="flex-1">
            <ViewTransition enter="page-in" exit="page-out" default="none">
              {children}
            </ViewTransition>
          </main>
          <SiteFooter />
          {/* Her sayfada telefon + e-posta. WhatsApp tuşu 2026-08-24'te
              kaldırıldı: 30 günde 20 tıklama aldı ve numarada WhatsApp
              hesabı hiç açılmadığı için hepsi karşılıksız kaldı. */}
          <ContactFloat />
          {/* Görünmez yardımcılar: kart ışığı + sekme/video dikkat yönetimi */}
          <PointerGlow />
          <PageAttention />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
