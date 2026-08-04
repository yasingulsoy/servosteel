import { setRequestLocale, getTranslations } from "next-intl/server";
import { Check, Gauge, Layers, Ruler, Settings2 } from "lucide-react";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { ProductShot } from "@/components/product-shot";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import type { AppLocale } from "@/i18n/routing";
import { RelatedReading } from "@/components/related-reading";

type Props = { params: Promise<{ locale: string }> };

const icons = [Layers, Ruler, Gauge, Settings2];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dilme" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/dilme-hatlari"),
  };
}

export default async function DilmeHatlariPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dilme");
  const td = await getTranslations("detail");

  const highlights = t.raw("highlights") as { title: string; text: string }[];
  const tableHead = t.raw("tableHead") as string[];
  const tableRows = t.raw("tableRows") as string[][];
  const components = t.raw("components") as string[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/dilme-hatlari" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <div className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
        <Reveal>
          <ProductShot src="/gorseller/dilme-hatlari.jpg" alt={t("title")} priority />
        </Reveal>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => {
            const Icon = icons[i] ?? Settings2;
            return (
              <Reveal key={h.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-line bg-card p-6">
                  <Icon className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                  <h2 className="mt-4 font-semibold text-ink">{h.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{h.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                {t("tableTitle")}
              </h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[520px] text-left text-sm">
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
              <p className="mt-4 text-sm text-muted">{t("tableNote")}</p>
            </Reveal>
          </div>

          <aside>
            <Reveal delay={120}>
              <div className="rounded-2xl bg-shell p-7 text-white">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {td("components")}
                </h2>
                <ul className="mt-5 space-y-3">
                  {components.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <FaqSection eyebrow={t("faqEyebrow")} title={t("faqTitle")} items={faq} />

      <RelatedReading path="/dilme-hatlari" locale={locale} />


      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
