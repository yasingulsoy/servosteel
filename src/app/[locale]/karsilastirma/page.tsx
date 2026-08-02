import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Scale } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { compareItems } from "@/lib/compare";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compare" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/karsilastirma"),
  };
}

export default async function KarsilastirmaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("compare");

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/karsilastirma" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal group className="grid gap-6 md:grid-cols-3">
          {compareItems.map((c) => (
            <Link
              key={c.slug}
              href={`/karsilastirma/${c.slug}`}
              data-spotlight
              className="group flex h-full flex-col rounded-2xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
            >
              <Scale className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
              <h2 className="font-display mt-4 text-lg font-bold uppercase leading-tight tracking-tight text-ink">
                {t(`items.${c.slug}.name`)}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {t(`items.${c.slug}.hero`)}
              </p>
              <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                {t("tableTitle")}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
