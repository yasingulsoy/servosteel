import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { SectorIcon } from "@/components/sector-icon";
import { sectors } from "@/lib/sectors";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sectors" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/uygulamalar"),
  };
}

export default async function UygulamalarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sectors");

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/uygulamalar" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {sectors.map((s, i) => (
            <Reveal key={s.slug} delay={i * 90}>
              <Link
                href={`/uygulamalar/${s.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-card p-7 transition-colors hover:border-accent/50"
              >
                <SectorIcon name={s.icon} className="size-9 text-accent" />
                <h2 className="font-display mt-5 text-xl font-bold uppercase tracking-tight text-ink">
                  {t(`items.${s.slug}.name`)}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {t(`items.${s.slug}.short`)}
                </p>
                <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                  {t("explore")}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
