import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Check, Crosshair, Layers, LayoutGrid, MonitorCog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sayfaMeta } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { InlineQuote } from "@/components/inline-quote";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { RelatedVideos } from "@/components/related-videos";
import type { AppLocale } from "@/i18n/routing";

/**
 * Asma Tavan Hatları — /asma-tavan-hatlari (Yasin, 11 Kas 2026: "üretim
 * hatlarına eklenecek").
 *
 * Perfore sayfasının düzeni:
 *  - Hat fotoğrafı yok. Başlığın altında kanaldaki "Asma Tavan Hattı" videosu
 *    duruyor (lib/videos.ts "/asma-tavan-hatlari").
 *  - Teknik tablo YOK: firmadan kapasite, kalınlık, hız verisi gelmedi;
 *    uydurma değer yazılmadı. Veri gelince tablo boy kesme/dilme gibi eklenir.
 *  - Desen bölümünün yerinde ürün tipleri (T profil, alçıpan C/U, clip-in,
 *    lay-in), kullanım alanlarının yerinde "hangi ürün hangi hattı ister".
 */

type Props = { params: Promise<{ locale: string }> };

const icons = [Crosshair, Layers, LayoutGrid, MonitorCog];

/* Ayrı satılan ürüne bağlanan bileşen — `asmaTavan.components` SIRASINA göre
   (9 dilde aynı sıra): rulo açıcı, roll form istasyonları, istifleme. Servo
   besleme bağlanmadı — perfore sayfasındaki gerekçe (firmadan teyit yok). */
const BILESEN_SAYFASI: Record<number, string> = {
  0: "/makineler/rulo-acicilar",
  4: "/roll-form-hatlari",
  6: "/makineler/otomatik-istifleyici",
};

/* "Hangi ürün, hangi hat" kartının bağlandığı sayfa — `asmaTavan.lines`
   SIRASINA göre (9 dilde aynı sıra): T profil, alçıpan profili, paneller. */
const HAT_SAYFASI = ["/roll-form-hatlari", "/makineler/otomatik-istifleyici", "/perfore-hatlari"] as const;

/** Ürün tipi kartlarının küçük kesit çizimi — `asmaTavan.types` sırasıyla:
 *  T profil, alçıpan C ve U, clip-in panel, T profile oturan lay-in panel. */
function KesitIkonu({ i }: { i: number }) {
  const d =
    i === 0
      ? "M26 4h8v6h-8z M30 10v16 M14 26h32"
      : i === 1
        ? "M24 12V7H10v19h14v-4 M34 7v19h16V7"
        : i === 2
          ? "M13 8H8v16h44V8h-5"
          : "M4 26h12 M10 26V16 M44 26h12 M50 26V16 M15 17v7h30v-7";
  return (
    <svg
      viewBox="0 0 60 32"
      className="h-8 w-16 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "asmaTavan" });
  return sayfaMeta(locale as AppLocale, "/asma-tavan-hatlari", {
    baslik: t("metaTitle"),
    aciklama: t("metaDesc"),
  });
}

export default async function AsmaTavanHatlariPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("asmaTavan");
  const td = await getTranslations("detail");

  const highlights = t.raw("highlights") as { title: string; text: string }[];
  const paras = t.raw("paras") as string[];
  const components = t.raw("components") as string[];
  const faq = t.raw("faq") as FaqItem[];
  const steps = t.raw("steps") as { title: string; text: string }[];
  const types = t.raw("types") as { title: string; text: string }[];
  const lines = t.raw("lines") as { title: string; line: string; text: string }[];

  /* Kartın altındaki bağlantı yazısı, gittiği sayfanın kendi başlığı —
     dokuz dilde menüyle aynı ad, yeni çeviri anahtarı yok. */
  const hatEtiketi = [
    (await getTranslations("hub"))("title"),
    (await getTranslations("products.machines"))("otomatik-istifleyici.name"),
    (await getTranslations("perfore"))("title"),
  ];

  return (
    <>
      <PageHero
        crumbs={[
          { label: (await getTranslations("ruloIsleme"))("title"), href: "/rulo-isleme-hatlari" },
          { label: t("title"), href: "/asma-tavan-hatlari" },
        ]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      {/* Fotoğraf yerine sahadan video, başlığın hemen altında */}
      <RelatedVideos path="/asma-tavan-hatlari" ust />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => {
            const Icon = icons[i] ?? Crosshair;
            return (
              <Reveal key={h.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-line bg-card p-6">
                  <Icon className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                  <h2 className="mt-4 font-semibold text-ink">{h.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{h.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{t("whyTitle")}</h2>
              <div className="mt-6 space-y-4 leading-relaxed text-muted">
                {paras.map((p, i) => (
                  <p key={i}>
                    {t.rich(`paras.${i}`, { b: (c) => <span className="font-semibold text-ink">{c}</span> })}
                  </p>
                ))}
              </div>
            </Reveal>

            {/* Teklif formu açıklamanın hemen altında — bkz. inline-quote.tsx */}
            <InlineQuote name={t("title")} />
          </div>

          <aside>
            <Reveal delay={120}>
              <div className="rounded-2xl bg-shell p-7 text-white">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">{td("components")}</h2>
                <ul className="mt-5 space-y-3">
                  {components.map((c, i) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      {BILESEN_SAYFASI[i] ? (
                        <Link
                          href={BILESEN_SAYFASI[i]}
                          className="text-white underline decoration-accent/60 underline-offset-4 transition-colors hover:decoration-accent"
                        >
                          {c}
                        </Link>
                      ) : (
                        c
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <section className="border-y border-line bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <Reveal>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{t("stepsTitle")}</h2>
          </Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <li className="h-full rounded-2xl border border-line bg-card p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-zinc-950">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{t("typesTitle")}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">{t("typesIntro")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-line bg-card p-5">
                <KesitIkonu i={i} />
                <h3 className="mt-4 font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 max-w-3xl rounded-2xl border-s-4 border-accent bg-surface-alt px-5 py-4 text-sm leading-relaxed text-ink">
            {t("typesNote")}
          </p>
        </Reveal>

        <Reveal>
          <h2 className="font-display mt-16 text-2xl font-bold uppercase tracking-tight text-ink">{t("linesTitle")}</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {lines.map((u, i) => (
            <Reveal key={u.title} delay={i * 60}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-5">
                <h3 className="font-semibold text-ink">{u.title}</h3>
                <p className="mt-1 text-sm font-semibold text-accent-ink">{u.line}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{u.text}</p>
                {HAT_SAYFASI[i] ? (
                  <Link
                    href={HAT_SAYFASI[i]}
                    className="group mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-accent-ink transition-colors hover:text-accent-strong"
                  >
                    {hatEtiketi[i]}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2} aria-hidden />
                  </Link>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{t("linesNote")}</p>
        </Reveal>
      </section>

      <FaqSection eyebrow={t("faqEyebrow")} title={t("faqTitle")} items={faq} />

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
