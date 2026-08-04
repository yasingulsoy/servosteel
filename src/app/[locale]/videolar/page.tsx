import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { Reveal } from "@/components/reveal";
import { VideoCard } from "@/components/video-card";
import { VideoSchema } from "@/components/video-schema";
import {
  allVideos,
  videoGroups,
  uncuratedVideos,
  videoTitleResolver,
  CHANNEL_VIDEO_COUNT,
} from "@/lib/videos";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/videolar"),
  };
}

export default async function VideolarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const tc = await getTranslations("common");

  /* Küratörlü 24'ün çevrilmiş başlığı varsa o, kalan 78 için gerçek YouTube
     başlığı. Çeviri yolu bilerek seçilmedi: gerekçe lib/videos.ts videoTitle. */
  const titleOf = videoTitleResolver((id) =>
    t.has(`items.${id}`) ? t(`items.${id}`) : undefined
  );

  return (
    <>
      {/* Kanalın TAMAMI için VideoObject — gerçek tarih ve süreyle */}
      <VideoSchema
        items={[...allVideos, ...uncuratedVideos]}
        titleOf={titleOf}
        description={t("metaDesc")}
      />

      <PageHero
        crumbs={[{ label: t("metaTitle"), href: "/videolar" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        {videoGroups.map((group, gi) => (
          <div key={group.key} className={gi > 0 ? "mt-16" : ""}>
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                  {t(`groups.${group.key}`)}
                </h2>
                {group.href && (
                  <Link
                    href={group.href}
                    className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
                  >
                    {tc("details")}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  </Link>
                )}
              </div>
            </Reveal>

            <Reveal group className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((v, i) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={titleOf(v.id)}
                  sec={v.sec}
                  /* İlk grubun ilk iki önizlemesi LCP adayı — öncelikli yüklenir */
                  priority={gi === 0 && i < 2}
                />
              ))}
            </Reveal>
          </div>
        ))}

        {/* KANALIN GERİ KALANI — küratörlü gruplara girmeyen videolar.
            Başlıkları YouTube'dan geldiği gibi; her biri yine VideoObject taşır. */}
        {uncuratedVideos.length > 0 && (
          <div className="mt-16">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                  {t("archiveTitle")}
                </h2>
                <p className="text-sm text-muted">
                  {t("archiveCount", { count: CHANNEL_VIDEO_COUNT })}
                </p>
              </div>
            </Reveal>
            <Reveal group className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {uncuratedVideos.map((v) => (
                <VideoCard key={v.id} id={v.id} title={titleOf(v.id)} sec={v.sec} />
              ))}
            </Reveal>
          </div>
        )}

        <Reveal>
          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-shell p-8 text-white lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                {t("bannerTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-400">{t("bannerText")}</p>
            </div>
            <SpecularButton
              href="https://www.youtube.com/@ServoSteel.ServoMold"
              external
              variant="gold"
              size="lg"
              className="shrink-0"
            >
              {t("bannerCta")}
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
            </SpecularButton>
          </div>
        </Reveal>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
