import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Check, Crosshair, Grip, Layers, MonitorCog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sayfaMeta } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { InlineQuote } from "@/components/inline-quote";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { RelatedVideos } from "@/components/related-videos";
import { ProductShot } from "@/components/product-shot";
import type { AppLocale } from "@/i18n/routing";

/**
 * Rulo Sac Perfore Hatları — /perfore-hatlari (Yasin, 11 Kas 2026: "üretim
 * hatlarına eklenecek").
 *
 * Boy kesme sayfasının düzeni; iki fark:
 *  - Üst fotoğraf yok. Başlığın altında kanaldaki dilme + punch delik delme
 *    videosu (lib/videos.ts "/perfore-hatlari") ve fabrikadan üç saha klibi
 *    duruyor; perfore sac fotoğrafı delik desenleri bölümünde (12 Kas).
 *  - Teknik tablo YOK: firmadan kapasite, kalınlık, hız verisi gelmedi;
 *    uydurma değer yazılmadı. Veri gelince tablo boy kesme/dilme gibi eklenir.
 */

type Props = { params: Promise<{ locale: string }> };

const icons = [Crosshair, Grip, Layers, MonitorCog];

/* Fabrikadan saha klipleri (Yasin, 12 Kas — Telegram'dan). Sessiz, döngü; kaynak
   dosyanın görüntüsüne dokunulmadı, yalnız ses izi çıkarıldı. Başlıklar
   `perfore.clips`, aynı sırayla. */
const KLIPLER = [
  { src: "/perfore-hatti.mp4", poster: "/perfore-hatti-poster.jpg", width: 848, height: 464, sec: 35, tarih: "2026-11-12" },
  { src: "/perfore-presi.mp4", poster: "/perfore-presi-poster.jpg", width: 848, height: 480, sec: 59, tarih: "2026-11-12" },
  { src: "/perfore-kalibi.mp4", poster: "/perfore-kalibi-poster.jpg", width: 848, height: 480, sec: 52, tarih: "2026-11-12" },
];
const FOTO = "/gorseller/perfore-sac.jpg";

/* Ayrı satılan makineye bağlanan bileşen — `perfore.components` SIRASINA göre
   (9 dilde aynı sıra). Servo beslemenin sattığımız servo sürücüyle aynı ürün
   olduğu firmadan teyit edilmedi (bkz. boy kesme sayfası); bağlanmadı. */
const BILESEN_SAYFASI: Record<number, string> = {
  0: "/makineler/rulo-acicilar",
};

/* Kullanım alanı kartından ilgili roll form hattına — `perfore.uses` SIRASINA
   göre (9 dilde aynı sıra): gürültü bariyeri, kablo kanalı, ağır raf. */
const KULLANIM_SAYFASI: Record<number, string> = {
  0: "/roll-form-hatlari/gurultu-bariyeri",
  3: "/roll-form-hatlari/kablo-kanali",
  4: "/roll-form-hatlari/agir-raf",
};

/** Delik deseni kartlarının küçük çizimi — `perfore.patterns` sırasıyla:
 *  yuvarlak, kare, oblong, dekoratif. Şaşırtmalı dizilim. */
function DesenIkonu({ i }: { i: number }) {
  const noktalar: [number, number][] = [];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) noktalar.push([8 + x * 12 + (y % 2) * 6, 8 + y * 11]);
  return (
    <svg viewBox="0 0 60 32" className="h-8 w-16 text-accent" aria-hidden>
      {noktalar.map(([x, y], k) =>
        i === 0 ? (
          <circle key={k} cx={x} cy={y} r={3} fill="currentColor" />
        ) : i === 1 ? (
          <rect key={k} x={x - 3} y={y - 3} width={6} height={6} fill="currentColor" />
        ) : i === 2 ? (
          <rect key={k} x={x - 4.5} y={y - 2} width={9} height={4} rx={2} fill="currentColor" />
        ) : (
          <path key={k} d={`M${x} ${y - 3.5}L${x + 3.5} ${y}L${x} ${y + 3.5}L${x - 3.5} ${y}Z`} fill="currentColor" />
        )
      )}
    </svg>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "perfore" });
  return sayfaMeta(locale as AppLocale, "/perfore-hatlari", {
    baslik: t("metaTitle"),
    aciklama: t("metaDesc"),
    gorsel: FOTO,
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
  const steps = t.raw("steps") as { title: string; text: string }[];
  const patterns = t.raw("patterns") as { title: string; text: string }[];
  const uses = t.raw("uses") as { title: string; text: string }[];
  const klipBaslik = t.raw("clips") as string[];

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

      {/* Fotoğraf yerine sahadan video, başlığın hemen altında: fabrika klipleri
          (kanal videosu 13 Kas'ta kaldırıldı, bkz. lib/videos.ts) */}
      <RelatedVideos
        path="/perfore-hatlari"
        ust
        klipler={KLIPLER.map((k, i) => ({ ...k, baslik: klipBaslik[i] ?? t("title") }))}
      />

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

      {/* Açıklayıcı bölümler (Yasin, 11 Kas: "içerisine bilgiler de ekle") */}
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
        {/* Solda desen girişi, sağda hattan çıkmış perfore sac fotoğrafı */}
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{t("patternsTitle")}</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted">{t("patternsIntro")}</p>
          </Reveal>
          <Reveal delay={90}>
            <figure>
              <ProductShot src={FOTO} alt={t("photoAlt")} ratio="4/3" sizes="(max-width: 1024px) 100vw, 600px" />
              <figcaption className="mt-3 text-sm text-muted">{t("photoAlt")}</figcaption>
            </figure>
          </Reveal>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {patterns.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-line bg-card p-5">
                <DesenIkonu i={i} />
                <h3 className="mt-4 font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 max-w-3xl rounded-2xl border-s-4 border-accent bg-surface-alt px-5 py-4 text-sm leading-relaxed text-ink">
            {t("openArea")}
          </p>
        </Reveal>

        <Reveal>
          <h2 className="font-display mt-16 text-2xl font-bold uppercase tracking-tight text-ink">{t("usesTitle")}</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uses.map((u, i) => {
            const href = KULLANIM_SAYFASI[i];
            const govde = (
              <>
                <h3 className="flex items-center gap-1.5 font-semibold text-ink">
                  {u.title}
                  {href ? (
                    <ArrowRight className="size-4 text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2} aria-hidden />
                  ) : null}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{u.text}</p>
              </>
            );
            return (
              <Reveal key={u.title} delay={i * 60}>
                {href ? (
                  <Link href={href} className="group block h-full rounded-2xl border border-line bg-card p-5 transition-colors hover:border-accent/50">
                    {govde}
                  </Link>
                ) : (
                  <div className="h-full rounded-2xl border border-line bg-card p-5">{govde}</div>
                )}
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{t("usesNote")}</p>
        </Reveal>
      </section>

      <FaqSection eyebrow={t("faqEyebrow")} title={t("faqTitle")} items={faq} />

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
