import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { SectorIcon } from "@/components/sector-icon";
import { VideoCard } from "@/components/video-card";
import { VideoSchema } from "@/components/video-schema";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { sectors, getSector, isSectorSlug } from "@/lib/sectors";
import { videoMeta } from "@/lib/videos";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    sectors.map((s) => ({ locale, slug: s.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isSectorSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: `sectors.items.${slug}` });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, `/uygulamalar/${slug}`),
  };
}

export default async function SectorPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isSectorSlug(slug)) notFound();
  setRequestLocale(locale);

  const sector = getSector(slug)!;
  const t = await getTranslations(`sectors.items.${slug}`);
  const ts = await getTranslations("sectors");
  const tRoll = await getTranslations("products.rollform");
  const tMach = await getTranslations("products.machines");
  const tv = await getTranslations("videos");

  const applications = t.raw("applications") as { title: string; text: string }[];
  const faq = t.has("faq") ? (t.raw("faq") as FaqItem[]) : [];

  /* Kanalda gerçekten var olan ve metadata'sı bilinen videolar.
     Tarihi olmayan video şemaya girmez — uydurma uploadDate şemayı geçersiz kılar. */
  const videos = sector.videos.map((id) => videoMeta(id)).filter((v) => v !== undefined);
  const titleOf = (id: string) => (tv.has(`items.${id}`) ? tv(`items.${id}`) : t("name"));

  return (
    <>
      {videos.length > 0 && (
        <VideoSchema items={videos} titleOf={titleOf} description={t("metaDesc")} />
      )}

      <PageHero
        crumbs={[
          { label: ts("title"), href: "/uygulamalar" },
          { label: t("name"), href: `/uygulamalar/${slug}` },
        ]}
        eyebrow={ts("eyebrow")}
        title={t("name")}
        description={t("desc")}
      />

      {/* UYGULAMALAR — sektörde hangi parçalar üretiliyor */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {ts("applicationsEyebrow")}
          </p>
          <h2 className="font-display mt-4 max-w-2xl text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {t("applicationsTitle")}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((a, i) => (
            <Reveal key={a.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-line bg-card p-6">
                <SectorIcon name={sector.icon} className="size-7 text-accent" />
                <h3 className="font-display mt-4 text-base font-bold uppercase tracking-tight text-ink">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* İLGİLİ HATLAR VE MAKİNELER — mevcut ürün sayfalarına bağlanır */}
      {(sector.lines.length > 0 || sector.machines.length > 0) && (
        <section className="border-y border-line bg-surface-alt">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
            <Reveal>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
                {ts("relatedTitle")}
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sector.lines.map((s, i) => (
                <Reveal key={s} delay={i * 70}>
                  <Link
                    href={`/roll-form-hatlari/${s}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-5 py-4 transition-colors hover:border-accent/50"
                  >
                    <span className="text-sm font-semibold text-ink">{tRoll(`${s}.name`)}</span>
                    <ArrowRight
                      className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </Reveal>
              ))}
              {sector.machines.map((s, i) => (
                <Reveal key={s} delay={(sector.lines.length + i) * 70}>
                  <Link
                    href={`/makineler/${s}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-5 py-4 transition-colors hover:border-accent/50"
                  >
                    <span className="text-sm font-semibold text-ink">{tMach(`${s}.name`)}</span>
                    <ArrowRight
                      className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SAHA KANITI — sektöre ait gerçek videolar */}
      {videos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
              <span className="h-px w-8 bg-accent" aria-hidden />
              {ts("proofEyebrow")}
            </p>
            <h2 className="font-display mt-4 max-w-3xl text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
              {ts("proofTitle")}
            </h2>
          </Reveal>
          <Reveal group className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => (
              <VideoCard key={v.id} id={v.id} title={titleOf(v.id)} sec={v.sec} priority={i < 2} />
            ))}
          </Reveal>
        </section>
      )}

      {faq.length > 0 && <FaqSection title={ts("faqTitle")} items={faq} />}

      {/* Diğer sektörler — yan geçiş */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted">
            {ts("otherTitle")}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {sectors
              .filter((s) => s.slug !== slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/uygulamalar/${s.slug}`}
                  className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent/50"
                >
                  <SectorIcon name={s.icon} className="size-4 text-accent" />
                  {ts(`items.${s.slug}.name`)}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
