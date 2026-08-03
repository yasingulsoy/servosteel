import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Factory, Target, Users, Wrench } from "lucide-react";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const valueIcons = [Target, Wrench, Factory, Users];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/hakkimizda"),
  };
}

export default async function HakkimizdaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const stats = t.raw("stats") as { value: string; label: string }[];
  const story = t.raw("story") as string[];
  const values = t.raw("values") as { title: string; text: string }[];
  const timeline = t.raw("timeline") as { title: string; text: string }[];
  const facility = t.raw("facility") as { alt: string; caption: string }[];
  const missionText = t.raw("missionText") as string[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("metaTitle"), href: "/hakkimizda" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="border-b border-line bg-surface">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-12 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 80}>
              <div className="flex flex-col-reverse items-center gap-1 text-center">
                <dt className="text-sm text-muted">{stat.label}</dt>
                <dd className="font-display text-4xl font-bold text-ink">
                  <CountUp value={stat.value} className="tabular-nums" />
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* TESİS — gerçek fabrika ve üretim fotoğrafları */}
      <section className="mx-auto max-w-7xl px-4 pt-16 lg:pt-20">
        <Reveal>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {t("facilityEyebrow")}
          </p>
          <h2 className="font-display mt-4 max-w-2xl text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {t("facilityTitle")}
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <figure className="mt-8">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-surface-alt">
              <Image
                src="/gorseller/tesis-uretim.jpg"
                alt={facility[0].alt}
                fill
                sizes="(max-width: 1280px) 100vw, 1216px"
                className="object-cover"
                priority
              />
            </div>
            <figcaption className="mt-3 text-sm text-muted">{facility[0].caption}</figcaption>
          </figure>
        </Reveal>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            { src: "/gorseller/tesis-bina.jpg", i: 1 },
            { src: "/gorseller/tesis-atolye.jpg", i: 2 },
          ].map(({ src, i }) => (
            <Reveal key={src} delay={150 + i * 80}>
              <figure>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-surface-alt">
                  <Image
                    src={src}
                    alt={facility[i].alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-sm text-muted">{facility[i].caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
              {t("storyTitle")}
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted">
              {story.map((p, i) => (
                <p key={i}>
                  {t.rich(`story.${i}`, { b: (c) => <span className="font-semibold text-ink">{c}</span> })}
                </p>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v, i) => {
              const Icon = valueIcons[i] ?? Target;
              return (
                <Reveal key={v.title} delay={i * 90}>
                  <div className="h-full rounded-2xl border border-line bg-card p-6">
                    <Icon className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                    <h3 className="font-display mt-4 text-base font-bold uppercase tracking-tight text-ink">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* VİZYON & MİSYON — resmî kurumsal metin */}
      <section className="border-y border-line bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
              <span className="h-px w-8 bg-accent" aria-hidden />
              {t("vmEyebrow")}
            </p>
          </Reveal>

          {/* col-span'ler Reveal'ın KENDİSİNDE olmalı: grid'in doğrudan çocuğu
              Reveal'ın render ettiği div'dir. İçteki bir div'e yazıldığında
              sarmalayıcı varsayılan 1 sütun kalır ve iki blok da 5'te 1'e
              sıkışır — bölüm bu yüzden dar iki şerit hâlinde görünüyordu. */}
          <div className="mt-8 grid gap-10 lg:grid-cols-5 lg:gap-14">
            <Reveal className="lg:col-span-2">
              <div className="rounded-2xl border-s-4 border-accent bg-card p-7 shadow-sm">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                  {t("visionTitle")}
                </h2>
                <p className="mt-4 leading-relaxed text-muted">{t("visionText")}</p>
              </div>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-3">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                {t("missionTitle")}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-muted">
                {missionText.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-shell text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
              <span className="h-px w-8 bg-accent" aria-hidden />
              {t("journeyEyebrow")}
            </p>
            <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              {t("journeyTitle")}
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((tl, i) => (
              <Reveal key={tl.title} delay={i * 120}>
                <li className="list-none">
                  <div className="font-display text-5xl font-extrabold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-3 h-px w-full bg-gradient-to-r from-accent/60 to-transparent" aria-hidden />
                  <h3 className="font-display mt-4 text-lg font-bold uppercase tracking-tight">{tl.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{tl.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
