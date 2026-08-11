import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Check, Cog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, localePath, pageTitle } from "@/i18n/seo";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { Reveal } from "@/components/reveal";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { RelatedVideos } from "@/components/related-videos";
import { machineVariants, isMachineVariant, variantsOf } from "@/lib/catalog";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Makine varyant sayfası — `/makineler/rulo-acicilar/hidrolik`
 *
 * Neden ayrı sayfa: üst sayfadaki özet tablo iki seriyi tek sütunda anlatmak
 * zorundaydı ve katalogdaki model listeleri (13 hidrolik, 12 mekanik) oraya
 * sığmıyordu. Alıcı "8 ton, 1.200 mm" diye arıyor; o eşleşmeyi ancak model
 * kırılımı verir.
 *
 * Üst sayfa DOKUNULMADAN kalır — "rulo açıcılar" kelimesinde 7. sırada ve
 * hub görevini sürdürüyor. Bu sayfa onun yerine geçmiyor, altına iniyor;
 * ikisi de birbirine link veriyor.
 */

type Props = { params: Promise<{ locale: string; slug: string; varyant: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    machineVariants.map((v) => ({ locale, slug: v.parent, varyant: v.slug }))
  );
}

const ns = (slug: string, varyant: string) => `products.variants.${slug}.${varyant}`;

export async function generateMetadata({ params }: Props) {
  const { locale, slug, varyant } = await params;
  if (!isMachineVariant(slug, varyant)) return {};
  const t = await getTranslations({ locale, namespace: ns(slug, varyant) });
  return {
    title: pageTitle(t.has("metaTitle") ? t("metaTitle") : t("name")),
    description: t("meta"),
    alternates: pageAlternates(locale as AppLocale, `/makineler/${slug}/${varyant}`),
  };
}

export default async function VariantPage({ params }: Props) {
  const { locale, slug, varyant } = await params;
  if (!isMachineVariant(slug, varyant)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(ns(slug, varyant));
  const td = await getTranslations("detail");
  const tm = await getTranslations("products.machines");
  const tv = await getTranslations("products.variants");

  const features = t.has("features") ? (t.raw("features") as { title: string; text: string }[]) : [];
  const why = td.raw("why") as string[];
  const faq = t.has("faq") ? (t.raw("faq") as FaqItem[]) : [];
  const tableHead = t.raw("table.head") as string[];
  const tableRows = t.raw("table.rows") as string[][];
  /* Kardeş varyantlar — aynı makinenin diğer tipleri */
  const kardesler = variantsOf(slug).filter((v) => v.slug !== varyant);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${localePath(locale as AppLocale, `/makineler/${slug}/${varyant}`)}#webpage`,
    name: t("name"),
    description: t("meta"),
    /* Üst sayfayı işaret eder: bu sayfa onun bir alt kırılımı, rakibi değil. */
    isPartOf: {
      "@id": `${SITE_URL}${localePath(locale as AppLocale, `/makineler/${slug}`)}#webpage`,
    },
    about: {
      "@type": "Thing",
      name: t("name"),
      description: t("meta"),
      brand: { "@type": "Brand", name: SITE_NAME },
      manufacturer: { "@id": `${SITE_URL}/#organization` },
      additionalProperty: tableRows.map((row) => ({
        "@type": "PropertyValue",
        name: row[0],
        value: row.slice(1).filter(Boolean).join(" / "),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        crumbs={[
          { label: tm(`${slug}.name`), href: `/makineler/${slug}` },
          { label: t("name"), href: `/makineler/${slug}/${varyant}` },
        ]}
        eyebrow={td("eyebrowMachine")}
        title={t("name")}
        description={t("hero")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                {t("table.title")}
              </h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="bg-surface-alt">
                    <tr>
                      {tableHead.map((h) => (
                        <th key={h} className="px-5 py-3.5 font-semibold text-ink">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row[0]} className="border-t border-line">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`px-5 py-3.5 ${ci === 0 ? "font-medium text-ink" : "text-muted"}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {t.has("tableNote") && (
                <p className="mt-3 text-sm leading-relaxed text-muted">{t("tableNote")}</p>
              )}
            </Reveal>

            {features.length > 0 && (
              <>
                <Reveal>
                  <h2 className="font-display mt-14 text-2xl font-bold uppercase tracking-tight text-ink">
                    {td("features")}
                  </h2>
                </Reveal>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {features.map((fe, i) => (
                    <Reveal key={fe.title} delay={i * 90}>
                      <div className="h-full rounded-2xl border border-line bg-card p-6">
                        <Cog className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                        <h3 className="mt-4 font-semibold text-ink">{fe.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{fe.text}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-6">
            <Reveal>
              <div className="rounded-2xl bg-shell p-7 text-white">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {td("whyTitle")}
                </h2>
                <ul className="mt-5 space-y-3">
                  {why.map((w) => (
                    <li key={w} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      {w}
                    </li>
                  ))}
                </ul>
                <SpecularButton href="/teklif-al" variant="gold" size="md" className="mt-6 w-full">
                  {td("machineQuote")}
                </SpecularButton>
              </div>
            </Reveal>

            {kardesler.length > 0 && (
              <Reveal delay={120}>
                <div className="rounded-2xl border border-line bg-card p-6">
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                    {tm(`${slug}.name`)}
                  </h2>
                  <div className="mt-4 space-y-2.5">
                    {kardesler.map((k) => (
                      <Link
                        key={k.slug}
                        href={`/makineler/${slug}/${k.slug}`}
                        className="block rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition-all hover:border-accent/50"
                      >
                        {tv(`${slug}.${k.slug}.name`)}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/makineler/${slug}`}
                    className="group mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
                  >
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} aria-hidden />
                    {tm(`${slug}.name`)}
                  </Link>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      <RelatedVideos path={`/makineler/${slug}`} />

      <FaqSection eyebrow={td("faqEyebrow")} title={td("faqTitle")} items={faq} />

      <CtaBand title={td("quoteTitle", { name: t("name") })} />
    </>
  );
}
