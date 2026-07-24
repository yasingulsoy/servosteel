import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Globe2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "refs" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/referanslar"),
  };
}

export default async function ReferanslarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("refs");

  const regions = t.raw("regions") as { name: string; text: string }[];
  const sectors = t.raw("sectors") as string[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("metaTitle"), href: "/referanslar" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {regions.map((r, i) => (
            <Reveal key={r.name} delay={i * 90}>
              <div className="h-full rounded-2xl border border-line bg-card p-6">
                <Globe2 className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                <h2 className="font-display mt-4 text-lg font-bold uppercase tracking-tight text-ink">
                  {r.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <h2 className="font-display mt-16 text-2xl font-bold uppercase tracking-tight text-ink">
            {t("sectorsTitle")}
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {sectors.map((s) => (
              <li key={s} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink">
                {s}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-surface-alt p-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                {t("videoProofTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-muted">{t("videoProofText")}</p>
            </div>
            <Link
              href="/videolar"
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-ink px-6 py-3.5 text-sm font-semibold text-surface transition-opacity hover:opacity-85"
            >
              {t("videoCta")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
