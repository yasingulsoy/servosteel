import { setRequestLocale, getTranslations } from "next-intl/server";
import { Check, Crosshair, Grip, Layers, MonitorCog } from "lucide-react";
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
 * Rulo Sac Perfore Hatları — /perfore-hatlari (Yasin, 11 Kas 2026: "üretim
 * hatlarına eklenecek").
 *
 * Boy kesme sayfasının düzeni; iki fark:
 *  - Hat fotoğrafı yok. Başlığın altında kanaldaki dilme + punch delik delme
 *    videosu duruyor (lib/videos.ts "/perfore-hatlari").
 *  - Teknik tablo YOK: firmadan kapasite, kalınlık, hız verisi gelmedi;
 *    uydurma değer yazılmadı. Veri gelince tablo boy kesme/dilme gibi eklenir.
 */

type Props = { params: Promise<{ locale: string }> };

const icons = [Crosshair, Grip, Layers, MonitorCog];

/* Ayrı satılan makineye bağlanan bileşen — `perfore.components` SIRASINA göre
   (9 dilde aynı sıra). Servo beslemenin sattığımız servo sürücüyle aynı ürün
   olduğu firmadan teyit edilmedi (bkz. boy kesme sayfası); bağlanmadı. */
const BILESEN_SAYFASI: Record<number, string> = {
  0: "/makineler/rulo-acicilar",
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "perfore" });
  return sayfaMeta(locale as AppLocale, "/perfore-hatlari", {
    baslik: t("metaTitle"),
    aciklama: t("metaDesc"),
  });
}

export default async function PerforeHatlariPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("perfore");
  const td = await getTranslations("detail");

  const highlights = t.raw("highlights") as { title: string; text: string }[];
  const paras = t.raw("paras") as string[];
  const components = t.raw("components") as string[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <>
      <PageHero
        crumbs={[
          { label: (await getTranslations("ruloIsleme"))("title"), href: "/rulo-isleme-hatlari" },
          { label: t("title"), href: "/perfore-hatlari" },
        ]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      {/* Fotoğraf yerine sahadan video, başlığın hemen altında */}
      <RelatedVideos path="/perfore-hatlari" ust />

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

      <FaqSection eyebrow={t("faqEyebrow")} title={t("faqTitle")} items={faq} />

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
