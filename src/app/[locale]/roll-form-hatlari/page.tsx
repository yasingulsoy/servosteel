import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { ProfileIcon } from "@/components/profile-icon";
import { Reveal } from "@/components/reveal";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { rollFormItems } from "@/lib/catalog";
import type { AppLocale } from "@/i18n/routing";
import { RelatedReading } from "@/components/related-reading";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hub" });
  return {
    title: pageTitle(t("title")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/roll-form-hatlari"),
  };
}

export default async function RollFormHatlariPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hub");
  const tRoll = await getTranslations("products.rollform");
  const tc = await getTranslations("common");
  const flow = t.raw("flow") as string[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/roll-form-hatlari" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Reveal>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
              {flow.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold text-ink">
                    <span className="text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </span>
                  {i < flow.length - 1 && (
                    <ArrowRight className="size-3.5 text-muted" strokeWidth={1.8} aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rollFormItems.map((line, i) => (
            <Reveal key={line.slug} delay={(i % 3) * 100}>
              <Link
                href={`/roll-form-hatlari/${line.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                  <Image
                    src={`/gorseller/${line.slug}.jpg`}
                    alt={tRoll(`${line.slug}.name`)}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-2.5">
                    <ProfileIcon k={line.icon} className="size-8 shrink-0 text-accent" />
                    <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                      {tRoll(`${line.slug}.name`)}
                    </h2>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{tRoll(`${line.slug}.short`)}</p>
                  <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                    {tc("details")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={200}>
            <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-muted/40 p-7">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                {t("customTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("customText")}</p>
              <Link href="/teklif-al" className="group mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                {t("customCta")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection eyebrow={t("faqEyebrow")} title={t("faqTitle")} items={faq} />

      <RelatedReading path="/roll-form-hatlari" locale={locale} />


      <CtaBand title={t("ctaTitle")} />
    </>
  );
}
