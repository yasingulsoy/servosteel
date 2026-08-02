import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { Reveal } from "@/components/reveal";
import { compareItems, getCompare, isCompareSlug } from "@/lib/compare";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

type Row = { label: string; a: string; b: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    compareItems.map((c) => ({ locale, slug: c.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isCompareSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: `compare.items.${slug}` });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, `/karsilastirma/${slug}`),
  };
}

export default async function ComparePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isCompareSlug(slug)) notFound();
  setRequestLocale(locale);

  const item = getCompare(slug)!;
  const t = await getTranslations(`compare.items.${slug}`);
  const tc = await getTranslations("compare");

  const rows = t.raw("rows") as Row[];
  const chooseA = t.raw("chooseA") as string[];
  const chooseB = t.raw("chooseB") as string[];

  return (
    <>
      <PageHero
        crumbs={[
          { label: tc("title"), href: "/karsilastirma" },
          { label: t("name"), href: `/karsilastirma/${slug}` },
        ]}
        eyebrow={tc("eyebrow")}
        title={t("name")}
        description={t("hero")}
      />

      <section className="mx-auto max-w-5xl px-4 py-16 lg:py-20">
        {/* Karşılaştırma tablosu — dar ekranda yatay kaydırılır, sayfa taşmaz */}
        <Reveal>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            {tc("tableTitle")}
          </h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="w-[26%] px-5 py-4 font-semibold text-ink">{tc("criterion")}</th>
                  <th className="px-5 py-4 font-semibold text-accent-ink">{t("aName")}</th>
                  <th className="px-5 py-4 font-semibold text-ink">{t("bName")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-line align-top">
                    <th scope="row" className="px-5 py-4 text-start font-medium text-ink">
                      {r.label}
                    </th>
                    <td className="px-5 py-4 leading-relaxed text-muted">{r.a}</td>
                    <td className="px-5 py-4 leading-relaxed text-muted">{r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Hangisi ne zaman */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal variant="left">
            <div className="h-full rounded-2xl border border-accent/40 bg-accent/5 p-7">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                {t("chooseATitle")}
              </h2>
              <ul className="mt-5 space-y-3">
                {chooseA.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal variant="right" delay={100}>
            <div className="h-full rounded-2xl border border-line bg-card p-7">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                {t("chooseBTitle")}
              </h2>
              <ul className="mt-5 space-y-3">
                {chooseB.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={2.2} aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Özet + ürün sayfasına köprü */}
        <Reveal>
          <div className="mt-12 rounded-2xl bg-shell p-8 text-white">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              {tc("verdictTitle")}
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-zinc-300">{t("verdict")}</p>
            <SpecularButton href={item.href} variant="gold" size="md" className="mt-6">
              {tc("seeProduct")}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </SpecularButton>
          </div>
        </Reveal>

        {/* Diğer karşılaştırmalar */}
        <Reveal>
          <div className="mt-14 border-t border-line pt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
              {tc("title")}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {compareItems
                .filter((c) => c.slug !== slug)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/karsilastirma/${c.slug}`}
                    className="group rounded-xl border border-line bg-card p-4 text-sm font-semibold leading-snug text-ink transition-all hover:border-accent/50"
                  >
                    {tc(`items.${c.slug}.name`)}
                  </Link>
                ))}
            </div>
          </div>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
