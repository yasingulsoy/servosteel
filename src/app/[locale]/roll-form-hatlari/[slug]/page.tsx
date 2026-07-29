import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Check, Settings2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { ProfileIcon } from "@/components/profile-icon";
import { Reveal } from "@/components/reveal";
import { rollFormItems, isRollFormSlug, rollFormIcon } from "@/lib/catalog";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    rollFormItems.map((line) => ({ locale, slug: line.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isRollFormSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: `products.rollform.${slug}` });
  return {
    title: t("name"),
    description: t("meta"),
    alternates: pageAlternates(locale as AppLocale, `/roll-form-hatlari/${slug}`),
  };
}

export default async function RollFormLinePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isRollFormSlug(slug)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(`products.rollform.${slug}`);
  const td = await getTranslations("detail");
  const tRoll = await getTranslations("products.rollform");

  const features = t.raw("features") as { title: string; text: string }[];
  const components = t.raw("components") as string[];
  const sectors = t.raw("sectors") as string[];
  const others = rollFormItems.filter((l) => l.slug !== slug).slice(0, 3);

  return (
    <>
      <PageHero
        crumbs={[
          { label: tRoll(`${slug}.name`), href: `/roll-form-hatlari/${slug}` },
        ]}
        eyebrow={td("eyebrowLine")}
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
                    <Settings2 className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                    <h3 className="mt-4 font-semibold text-ink">{fe.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{fe.text}</p>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={features.length * 90}>
                <div className="flex h-full flex-col items-start justify-center rounded-2xl border border-line bg-surface-alt p-6">
                  <ProfileIcon k={rollFormIcon(slug)} className="size-16 text-accent" />
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {td.rich("profileNote", { b: (c) => <span className="font-semibold text-ink">{c}</span> })}
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal>
              <h2 className="font-display mt-14 text-2xl font-bold uppercase tracking-tight text-ink">
                {td("sectors")}
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
                <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-zinc-400">
                  {td("componentsNote")}
                </p>
                <SpecularButton href="/teklif-al" variant="gold" size="md" className="mt-6 w-full">
                  {td("lineQuote")}
                </SpecularButton>
              </div>
            </Reveal>
          </aside>
        </div>

        <Reveal>
          <div className="mt-20 border-t border-line pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                {td("otherLines")}
              </h2>
              <Link href="/roll-form-hatlari" className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                {td("otherLines")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/roll-form-hatlari/${o.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-line bg-card p-4 transition-all hover:border-accent/50"
                >
                  <ProfileIcon k={o.icon} className="size-9 shrink-0 text-muted transition-colors group-hover:text-accent" />
                  <span className="text-sm font-semibold leading-snug text-ink">{tRoll(`${o.slug}.name`)}</span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <CtaBand title={td("quoteTitle", { name: t("name") })} />
    </>
  );
}
