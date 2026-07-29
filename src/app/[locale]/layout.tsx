import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Montserrat, Cairo } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { routing, isRtl, type AppLocale } from "@/i18n/routing";
import { pageAlternates } from "@/i18n/seo";
import { CONTACT, SITE_NAME, SITE_URL, SOCIAL_URLS } from "@/lib/site";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800"],
});

/* Arapça için ayrı font — Inter/Montserrat Arapça glif içermez. RTL'de devreye girer. */
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-full.png`,
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
      email: CONTACT.email,
      contactType: "sales",
      areaServed: "Worldwide",
      availableLanguage: ["Turkish", "English", "German", "Spanish", "Italian", "Hungarian", "Polish", "Russian"],
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

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${inter.variable} ${montserrat.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
