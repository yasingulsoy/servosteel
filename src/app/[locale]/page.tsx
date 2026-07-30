import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight as ArrowRightIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { Reveal } from "@/components/reveal";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { VideoBand } from "@/components/video-band";
import { HeroVideo } from "@/components/hero-video";
import { ProfileIcon } from "@/components/profile-icon";
import { SolutionIcon } from "@/components/solution-icon";
import { rollFormItems, machineItems } from "@/lib/catalog";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return { alternates: pageAlternates(locale as AppLocale, "") };
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
      <span className="h-px w-8 bg-accent" aria-hidden />
      {children}
    </p>
  );
}

function ArrowRight() {
  return (
    <ArrowRightIcon
      className="size-4 transition-transform group-hover:translate-x-0.5"
      strokeWidth={1.8}
      aria-hidden
    />
  );
}

const solutionMeta = [
  { key: "rollform", href: "/roll-form-hatlari", icon: "rollform" as const },
  { key: "slitting", href: "/dilme-hatlari", icon: "slitting" as const },
  { key: "ctl", href: "/boy-kesme-hatlari", icon: "ctl" as const },
];

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tRoll = await getTranslations("products.rollform");
  const tMach = await getTranslations("products.machines");

  const process = t.raw("process") as { title: string; text: string }[];

  return (
    <>
      {/* HERO — tam ekran arka plan videosu */}
      <HeroVideo />

      {/* İSTATİSTİK ŞERİDİ — şimdilik kaldırıldı. Geri açmak için: metinler 9 dilde
          messages/{locale}.json içinde "home.stats" altında hazır duruyor. */}

      {/* 3 ANA ÇÖZÜM */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:py-24">
        <Reveal>
          <SectionEyebrow>{t("solutionsEyebrow")}</SectionEyebrow>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display max-w-xl text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
              {t("solutionsTitle")}
            </h2>
            <p className="max-w-md text-muted">{t("solutionsText")}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {solutionMeta.map((s, i) => (
            <Reveal key={s.href} delay={i * 100}>
              <Link
                href={s.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card text-accent transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                  <Image
                    src={`/gorseller${s.href}.jpg`}
                    alt={t(`solutions.${s.key}.title`)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <SolutionIcon name={s.icon} className="size-10 text-accent" />
                  <h3 className="font-display mt-4 text-xl font-bold uppercase tracking-tight text-ink">
                    {t(`solutions.${s.key}.title`)}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {t(`solutions.${s.key}.desc`)}
                  </p>
                  <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                    {t("cta2")}
                    <ArrowRight />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <VideoBand />

      {/* ROLL FORM ALT HATLARI */}
      <section className="bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:py-24">
          <Reveal>
            <SectionEyebrow>{t("rollformEyebrow")}</SectionEyebrow>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display max-w-2xl text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
                {t("rollformTitle")}
              </h2>
              <Link href="/roll-form-hatlari" className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                {t("rollformSeeAll")}
                <ArrowRight />
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rollFormItems.map((line, i) => (
              <Reveal key={line.slug} delay={(i % 4) * 80}>
                <Link
                  href={`/roll-form-hatlari/${line.slug}`}
                  className="group block h-full overflow-hidden rounded-xl border border-line bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/10"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
                    <Image
                      src={`/gorseller/${line.slug}.jpg`}
                      alt={tRoll(`${line.slug}.name`)}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 p-4">
                    <ProfileIcon k={line.icon} className="size-7 shrink-0 text-accent" />
                    <h3 className="text-sm font-semibold leading-snug text-ink">
                      {tRoll(`${line.slug}.name`)}
                    </h3>
                  </div>
                </Link>
              </Reveal>
            ))}
            <Reveal delay={240}>
              <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-muted/40 p-5">
                <p className="text-sm leading-relaxed text-muted">
                  {t.rich("customText", { b: (c) => <span className="font-semibold text-ink">{c}</span> })}
                </p>
                <Link href="/teklif-al" className="group mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                  {t("rollformSeeAll")}
                  <ArrowRight />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MAKİNELER */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:py-24">
        <Reveal>
          <SectionEyebrow>{t("machinesEyebrow")}</SectionEyebrow>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display max-w-xl text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
              {t("machinesTitle")}
            </h2>
            <Link href="/makineler" className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
              {t("machinesSeeAll")}
              <ArrowRight />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {machineItems.map((m, i) => (
            <Reveal key={m.slug} delay={i * 80}>
              <Link
                href={`/makineler/${m.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/10"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
                  <Image
                    src={`/gorseller/${m.slug}.jpg`}
                    alt={tMach(`${m.slug}.name`)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                    {tMach(`${m.slug}.name`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{tMach(`${m.slug}.short`)}</p>
                  <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                    {t("cta2")}
                    <ArrowRight />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SÜREÇ */}
      <section className="bg-shell text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:py-24">
          <Reveal>
            <SectionEyebrow>{t("processEyebrow")}</SectionEyebrow>
            <h2 className="font-display mt-4 max-w-2xl text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              {t("processTitle")}
            </h2>
          </Reveal>

          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <li className="list-none">
                  <div className="font-display text-5xl font-extrabold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-3 h-px w-full bg-gradient-to-r from-accent/60 to-transparent" aria-hidden />
                  <h3 className="font-display mt-4 text-lg font-bold uppercase tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* VİDEO */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionEyebrow>{t("videoEyebrow")}</SectionEyebrow>
            <h2 className="font-display mt-4 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
              {t("videoTitle")}
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted">{t("videoText")}</p>
            <SpecularButton href="/videolar" variant="dark" size="lg" className="mt-8">
              {t("videoCta")}
              <ArrowRight />
            </SpecularButton>
          </Reveal>
          <Reveal delay={150}>
            <div className="overflow-hidden rounded-2xl border border-line bg-shell shadow-xl shadow-black/10">
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/2tgCtC8n_1E"
                  title={t("videoAria")}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="size-full"
                />
              </div>
              <p className="px-4 py-3 text-sm font-medium text-zinc-400">{t("videoBadge")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
