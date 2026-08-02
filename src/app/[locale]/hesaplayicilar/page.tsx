import { setRequestLocale, getTranslations } from "next-intl/server";
import { Info } from "lucide-react";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { Calculators } from "@/components/calculators";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calc" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/hesaplayicilar"),
  };
}

export default async function HesaplayicilarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calc");

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/hesaplayicilar" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-14 lg:py-16">
        <Calculators />

        <Reveal>
          <p className="mt-10 flex items-start gap-3 rounded-2xl border border-line bg-surface-alt p-5 text-sm leading-relaxed text-muted">
            <Info className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
            {t("disclaimer")}
          </p>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
