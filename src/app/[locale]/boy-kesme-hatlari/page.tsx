import { setRequestLocale, getTranslations } from "next-intl/server";
import { Check, Crosshair, MonitorCog, Scissors, ShieldCheck } from "lucide-react";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { ProductShot } from "@/components/product-shot";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const icons = [Crosshair, Scissors, MonitorCog, ShieldCheck];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "boykesme" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/boy-kesme-hatlari"),
  };
}

export default async function BoyKesmeHatlariPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("boykesme");
  const td = await getTranslations("detail");

  const highlights = t.raw("highlights") as { title: string; text: string }[];
  const paras = t.raw("paras") as string[];
  const components = t.raw("components") as string[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/boy-kesme-hatlari" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <div className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
        <Reveal>
          <ProductShot src="/gorseller/boy-kesme-hatlari.jpg" alt={t("title")} priority />
        </Reveal>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => {
            const Icon = icons[i] ?? Crosshair;
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
                {t("whyTitle")}
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-muted">
                {paras.map((p, i) => (
                  <p key={i}>
                    {t.rich(`paras.${i}`, { b: (c) => <span className="font-semibold text-ink">{c}</span> })}
                  </p>
                ))}
              </div>
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

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
