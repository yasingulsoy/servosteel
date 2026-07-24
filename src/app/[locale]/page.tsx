import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight as ArrowRightIcon, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/i18n/seo";
import { Reveal } from "@/components/reveal";
import { CtaBand } from "@/components/cta-band";
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

function CoilIllustration({ measure }: { measure: string }) {
  return (
    <svg viewBox="0 0 520 400" fill="none" className="w-full" aria-hidden>
      <g stroke="#3f3f46" strokeWidth="0.6" opacity="0.35">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={20 + i * 48} y1="20" x2={20 + i * 48} y2="380" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1="20" y1={20 + i * 48} x2="500" y2={20 + i * 48} />
        ))}
      </g>
      <g transform="translate(150 200)">
        <circle r="118" stroke="#71717a" strokeWidth="2.5" />
        <circle r="96" stroke="#52525b" strokeWidth="1.5" className="animate-spin-slow" strokeDasharray="10 14" />
        <circle r="74" stroke="#52525b" strokeWidth="1.5" />
        <circle r="52" stroke="#52525b" strokeWidth="1.5" />
        <circle r="30" stroke="#e7a300" strokeWidth="2.5" />
        <circle r="8" fill="#e7a300" />
      </g>
      <g strokeLinecap="round">
        <path d="M150 82 H 470" stroke="#71717a" strokeWidth="10" opacity="0.9" />
        <path d="M150 82 H 470" stroke="#a1a1aa" strokeWidth="3" opacity="0.5" />
        <path d="M256 148 C 330 148 360 128 470 126" stroke="#e7a300" strokeWidth="10" className="animate-flow" />
        <path d="M266 190 C 340 192 380 172 470 168" stroke="#71717a" strokeWidth="10" opacity="0.9" />
        <path d="M266 214 C 340 216 380 208 470 210" stroke="#71717a" strokeWidth="10" opacity="0.7" />
        <path d="M256 256 C 330 258 370 250 470 252" stroke="#71717a" strokeWidth="10" opacity="0.5" />
      </g>
      <g stroke="#e7a300" strokeWidth="1.2">
        <line x1="470" y1="112" x2="470" y2="140" />
        <line x1="486" y1="112" x2="486" y2="140" />
        <line x1="470" y1="126" x2="486" y2="126" />
      </g>
      <text x="494" y="130" className="fill-accent-ink" fontSize="11" fontFamily="var(--font-inter)">
        {measure}
      </text>
    </svg>
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

  const stats = t.raw("stats") as { value: string; label: string }[];
  const process = t.raw("process") as { title: string; text: string }[];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface text-ink">
        <div
          aria-hidden
          className="animate-breathe pointer-events-none absolute -right-40 -top-40 size-[480px] rounded-full bg-accent/15 blur-[120px]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="animate-rise flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              {t("badge")}
            </p>
            <h1 className="font-display animate-rise mt-5 text-4xl font-extrabold uppercase leading-[1.08] tracking-tight [animation-delay:100ms] sm:text-5xl lg:text-6xl">
              {t("h1l1")}
              <br />
              <span className="text-accent">{t("h1l2")}</span>
              <br />
              {t("h1l3")}
            </h1>
            <p className="animate-rise mt-6 max-w-lg text-lg leading-relaxed text-ink/80 [animation-delay:200ms]">
              {t("sub")}
            </p>
            <div className="animate-rise mt-9 flex flex-wrap gap-4 [animation-delay:300ms]">
              <Link
                href="/teklif-al"
                className="rounded-lg bg-accent px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-accent/30 transition-all hover:bg-accent-strong hover:shadow-accent/50"
              >
                {t("cta1")}
              </Link>
              <Link
                href="/roll-form-hatlari"
                className="rounded-lg border border-ink/25 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
              >
                {t("cta2")}
              </Link>
            </div>
          </div>
          <div className="animate-rise relative hidden [animation-delay:250ms] lg:block">
            <CoilIllustration measure={t("measure")} />
          </div>
        </div>

        <div className="border-t border-line bg-surface-alt">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-9 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80}>
                <div className="flex flex-col-reverse items-center gap-1 text-center">
                  <dt className="text-sm text-muted">{stat.label}</dt>
                  <dd className="font-display text-4xl font-bold text-ink">{stat.value}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

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
                className="group flex h-full flex-col rounded-2xl border border-line bg-card p-7 text-accent transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
              >
                <SolutionIcon name={s.icon} className="size-14 text-ink transition-colors group-hover:text-accent" />
                <h3 className="font-display mt-6 text-xl font-bold uppercase tracking-tight text-ink">
                  {t(`solutions.${s.key}.title`)}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {t(`solutions.${s.key}.desc`)}
                </p>
                <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                  {t("cta2")}
                  <ArrowRight />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

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
                  className="group block h-full rounded-xl border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/10"
                >
                  <ProfileIcon k={line.icon} className="size-11 text-muted transition-colors group-hover:text-accent" />
                  <h3 className="mt-4 text-sm font-semibold leading-snug text-ink">
                    {tRoll(`${line.slug}.name`)}
                  </h3>
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
                className="group block h-full rounded-2xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/10"
              >
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                  {tMach(`${m.slug}.name`)}
                </h3>
                <p className="mt-2 text-sm text-muted">{tMach(`${m.slug}.short`)}</p>
                <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                  {t("cta2")}
                  <ArrowRight />
                </span>
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
            <Link
              href="/videolar"
              className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3.5 text-sm font-semibold text-surface transition-opacity hover:opacity-85"
            >
              {t("videoCta")}
              <ArrowRight />
            </Link>
          </Reveal>
          <Reveal delay={150}>
            <a
              href="https://www.youtube.com/@ServoSteel.ServoMold"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-shell"
              aria-label={t("videoAria")}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(115deg,transparent_0_26px,rgba(200,200,200,0.1)_26px_27px)]"
              />
              <span className="flex size-20 items-center justify-center rounded-full bg-accent shadow-2xl shadow-accent/40 transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 size-8 fill-current text-zinc-950" aria-hidden />
              </span>
              <span className="absolute bottom-5 left-5 text-sm font-medium text-zinc-400">
                {t("videoBadge")}
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
