import { setRequestLocale, getTranslations } from "next-intl/server";
import { Recycle, Zap, LineChart, Wrench } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { VideoCard } from "@/components/video-card";
import { VideoSchema } from "@/components/video-schema";
import { videoMeta, videoTitleResolver } from "@/lib/videos";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const pillarIcons = [Recycle, Zap, LineChart, Wrench];

/**
 * Dijitalleşmenin KANITI — kanalda yayınlanmış gerçek video:
 * "Roll Forming Line Machine HMI & Production Reporting Software".
 * Sayfa "hedefliyoruz" demek yerine çalışan sistemi gösterebiliyor.
 */
const PROOF_VIDEOS = ["NR25bt36uQg", "qmWM1NgcACw"];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sustain" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/surdurulebilirlik"),
  };
}

export default async function SurdurulebilirlikPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sustain");
  const tv = await getTranslations("videos");

  const pillars = t.raw("pillars") as { title: string; text: string }[];
  const goals = t.raw("goals") as { title: string; text: string }[];

  const videos = PROOF_VIDEOS.map((id) => videoMeta(id)).filter((v) => v !== undefined);
  const titleOf = videoTitleResolver((id) =>
    tv.has(`items.${id}`) ? tv(`items.${id}`) : undefined
  );

  return (
    <>
      {videos.length > 0 && (
        <VideoSchema items={videos} titleOf={titleOf} description={t("metaDesc")} />
      )}

      <PageHero
        crumbs={[{ label: t("title"), href: "/surdurulebilirlik" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      {/* YAKLAŞIM — neden makinenin yaptığı iş üzerinden konuşuyoruz */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
              <span className="h-px w-8 bg-accent" aria-hidden />
              {t("approachEyebrow")}
            </p>
            <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
              {t("approachTitle")}
            </h2>
            <p className="mt-5 leading-relaxed text-muted">{t("approachText")}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {pillars.map((p, i) => {
            const Icon = pillarIcons[i] ?? Recycle;
            return (
              <Reveal key={p.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-line bg-card p-7">
                  <Icon className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                  <h3 className="font-display mt-4 text-lg font-bold uppercase tracking-tight text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-10 rounded-2xl border-s-4 border-accent bg-surface-alt p-7">
            <p className="leading-relaxed text-muted">
              {t.rich("calcNote", {
                calc: (c) => (
                  <Link href="/hesaplayicilar" className="font-semibold text-accent-ink underline-offset-4 hover:underline">
                    {c}
                  </Link>
                ),
                article: (c) => (
                  <Link
                    href="/akademi/sac-fire-oranini-dusurmek"
                    className="font-semibold text-accent-ink underline-offset-4 hover:underline"
                  >
                    {c}
                  </Link>
                ),
              })}
            </p>
          </div>
        </Reveal>
      </section>

      {/* SAHADAN KANIT — dijitalleşme iddiası değil, çalışan sistem */}
      {videos.length > 0 && (
        <section className="border-y border-line bg-surface-alt">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
            <Reveal>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
                {t("proofTitle")}
              </h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-muted">{t("proofText")}</p>
            </Reveal>
            <Reveal group className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, i) => (
                <VideoCard key={v.id} id={v.id} title={titleOf(v.id)} sec={v.sec} priority={i < 2} />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* 2026 HEDEFLERİ — niyet olarak yazılır, başarı olarak değil */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {t("goalsEyebrow")}
          </p>
          <h2 className="font-display mt-4 max-w-2xl text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {t("goalsTitle")}
          </h2>
        </Reveal>
        <ol className="mt-10 grid gap-8 lg:grid-cols-3">
          {goals.map((g, i) => (
            <Reveal key={g.title} delay={i * 110}>
              <li className="list-none">
                <div className="font-display text-4xl font-extrabold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-accent/60 to-transparent rtl:bg-gradient-to-l" aria-hidden />
                <h3 className="font-display mt-4 text-lg font-bold uppercase tracking-tight text-ink">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{g.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
