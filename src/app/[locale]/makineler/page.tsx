import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { machineItems } from "@/lib/catalog";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "machinesHub" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/makineler"),
  };
}

export default async function MakinelerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("machinesHub");
  const tm = await getTranslations("products.machines");
  const tc = await getTranslations("common");

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/makineler" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {machineItems.map((m, i) => {
            const hasTable = tm.has(`${m.slug}.table`);
            const rows = hasTable ? (tm.raw(`${m.slug}.table.rows`) as string[][]) : [];
            return (
              <Reveal key={m.slug} delay={(i % 2) * 100}>
                <Link
                  href={`/makineler/${m.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
                >
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                    {tm(`${m.slug}.name`)}
                  </h2>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">{tm(`${m.slug}.short`)}</p>
                  {hasTable && (
                    <p className="mt-4 rounded-lg bg-surface-alt px-4 py-2.5 text-sm font-medium text-ink">
                      {rows.map((r) => r.join(": ")).join(" · ")}
                    </p>
                  )}
                  <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                    {tc("details")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <CtaBand title={t("ctaTitle")} />
    </>
  );
}
