import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Check, Cog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, localePath } from "@/i18n/seo";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { Reveal } from "@/components/reveal";
import { ProductShot } from "@/components/product-shot";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { machineItems, isMachineSlug } from "@/lib/catalog";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    machineItems.map((m) => ({ locale, slug: m.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isMachineSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: `products.machines.${slug}` });
  return {
    title: t("name"),
    description: t("meta"),
    alternates: pageAlternates(locale as AppLocale, `/makineler/${slug}`),
  };
}

export default async function MachinePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isMachineSlug(slug)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(`products.machines.${slug}`);
  const td = await getTranslations("detail");
  const tm = await getTranslations("products.machines");

  const features = t.raw("features") as { title: string; text: string }[];
  const sectors = t.raw("sectors") as string[];
  const why = td.raw("why") as string[];
  const hasTable = t.has("table");
  const tableHead = hasTable ? (t.raw("table.head") as string[]) : [];
  const tableRows = hasTable ? (t.raw("table.rows") as string[][]) : [];
  const others = machineItems.filter((m) => m.slug !== slug);
  /* FAQ opsiyoneldir — yalnızca mesaj dosyasında tanımlı makinelerde görünür. */
  const faq = t.has("faq") ? (t.raw("faq") as FaqItem[]) : [];

  /**
   * Product şeması — spec tablosundan otomatik üretilir.
   * Amacı iki yönlü: (1) sayısal spec'leri makine tarafından okunabilir kılıp
   * yapay zeka aramalarında doğru şekilde Servosteel'e atfedilmesini sağlamak,
   * (2) `manufacturer` bağıyla "üretici mi tedarikçi mi" belirsizliğini kapatmak.
   * Fiyat bilgisi bilinçli olarak YOK — bu makineler tekliflendirilerek satılır.
   */
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}${localePath(locale as AppLocale, `/makineler/${slug}`)}#product`,
    name: t("name"),
    description: t("meta"),
    image: `${SITE_URL}/gorseller/${slug}.jpg`,
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@id": `${SITE_URL}/#organization` },
    ...(hasTable && tableRows.length
      ? {
          additionalProperty: tableRows.map((row) => ({
            "@type": "PropertyValue",
            name: row[0],
            value: row.slice(1).filter(Boolean).join(" / "),
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <PageHero
        crumbs={[
          { label: tm(`${slug}.name`), href: `/makineler/${slug}` },
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

            {hasTable && (
              <Reveal>
                <h2 className="font-display mt-14 text-2xl font-bold uppercase tracking-tight text-ink">
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
                            <td key={ci} className={`px-5 py-3.5 ${ci === 0 ? "font-medium text-ink" : "text-muted"}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            )}

            <Reveal>
              <h2 className="font-display mt-14 text-2xl font-bold uppercase tracking-tight text-ink">
                {td("usage")}
              </h2>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {sectors.map((s) => (
                  <li key={s} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink">
                    {s}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <aside className="space-y-6">
            <Reveal>
              <ProductShot src={`/gorseller/${slug}.jpg`} alt={t("name")} ratio="4/3" fit="contain" sizes="(max-width: 1024px) 100vw, 400px" />
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-2xl bg-shell p-7 text-white">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {td("whyTitle")}
                </h2>
                <ul className="mt-5 space-y-3">
                  {why.map((tItem) => (
                    <li key={tItem} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      {tItem}
                    </li>
                  ))}
                </ul>
                <SpecularButton href="/teklif-al" variant="gold" size="md" className="mt-6 w-full">
                  {td("machineQuote")}
                </SpecularButton>
              </div>
            </Reveal>
          </aside>
        </div>

        <Reveal>
          <div className="mt-20 border-t border-line pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                {td("otherMachines")}
              </h2>
              <Link href="/makineler" className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                {td("otherMachines")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/makineler/${o.slug}`}
                  className="group rounded-xl border border-line bg-card p-4 text-sm font-semibold leading-snug text-ink transition-all hover:border-accent/50"
                >
                  {tm(`${o.slug}.name`)}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <FaqSection eyebrow={td("faqEyebrow")} title={td("faqTitle")} items={faq} />

      <CtaBand title={td("quoteTitle", { name: t("name") })} />
    </>
  );
}
