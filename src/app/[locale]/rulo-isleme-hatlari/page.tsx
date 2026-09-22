import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sayfaMeta } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { RelatedReading } from "@/components/related-reading";
import { machineItems } from "@/lib/catalog";
import type { AppLocale } from "@/i18n/routing";

/**
 * Üç hat ailesinin üst sayfası: rulodan şeride, levhaya ya da profile.
 *
 * Neden ayrı sayfa (2026-09-23): "coil processing line(s)" aramasında
 * İngiltere, İtalya ve Almanya'dan 28 günde 88 gösterim alıyoruz ama 21-26.
 * sıradayız ve tıklama sıfır (GSC). İlk sıralardakiler arku, selmach,
 * bradbury, georg — yani birebir rakip sınıfımız, niyet de alıcı niyeti
 * (SERP kontrolü 2026-09-23). Terim üç ailenin TAMAMINI kastediyor; o güne
 * kadar aramaya dilme hattı sayfası çıkıyordu, yani ürün sayfası kategori
 * sorusunu cevaplıyordu. Burası o sorunun sayfası: üçünü anlatır, hangisinin
 * hangi işe yaradığını söyler ve ilgili sayfaya gönderir.
 *
 * İçerikte YENİ iddia yok — üç hat sayfasındaki, makine sayfalarındaki ve ana
 * sayfadaki doğrulanmış bilgiler (kapasite aralıkları, fiyata dahil kurulum,
 * 48 saatte teklif, 48+ ülke) toparlandı.
 */

type Props = { params: Promise<{ locale: string }> };

const AILELER = [
  { anahtar: "slitting", href: "/dilme-hatlari", gorsel: "/gorseller/dilme-hatlari.jpg" },
  { anahtar: "ctl", href: "/boy-kesme-hatlari", gorsel: "/gorseller/boy-kesme-hatlari.jpg" },
  { anahtar: "rollform", href: "/roll-form-hatlari", gorsel: "/gorseller/roll-form-hatlari.jpg" },
] as const;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ruloIsleme" });
  return sayfaMeta(locale as AppLocale, "/rulo-isleme-hatlari", {
    baslik: t("metaTitle"),
    aciklama: t("metaDesc"),
    gorsel: "/gorseller/roll-form-hatlari.jpg",
  });
}

export default async function RuloIslemeHatlariPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ruloIsleme");
  const tm = await getTranslations("products.machines");
  const tc = await getTranslations("common");
  /* Aile başlıkları kendi sayfalarının çevirisinden gelir — aynı ad iki yerde
     ayrı çevrilmesin, menüyle ve sayfa başlıklarıyla birebir aynı kalsın. */
  const aileBasliklari = [
    (await getTranslations("dilme"))("title"),
    (await getTranslations("boykesme"))("title"),
    (await getTranslations("hub"))("title"),
  ];
  const steps = t.raw("steps") as { title: string; text: string }[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/rulo-isleme-hatlari" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            {t("familiesTitle")}
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {AILELER.map((aile, i) => (
            <Reveal key={aile.anahtar} delay={i * 90}>
              <Link
                href={aile.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                  <Image
                    src={aile.gorsel}
                    alt={aileBasliklari[i]}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                    {aileBasliklari[i]}
                  </h3>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">{t(`families.${aile.anahtar}`)}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                    {tc("details")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
            <Reveal>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                {t("machinesTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-muted">{t("machinesText")}</p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {machineItems.map((m, i) => (
                <Reveal key={m.slug} delay={i * 60}>
                  <Link
                    href={`/makineler/${m.slug}`}
                    className="group flex h-full items-start gap-3 rounded-xl border border-line bg-card p-5 transition-colors hover:border-accent/50"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.4} aria-hidden />
                    <span>
                      <span className="block font-semibold text-ink">{tm(`${m.slug}.name`)}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">{tm(`${m.slug}.short`)}</span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{t("stepsTitle")}</h2>
        </Reveal>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <li className="h-full rounded-2xl border border-line bg-card p-7">
                <span className="font-display text-3xl font-bold text-accent">{i + 1}</span>
                <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <FaqSection eyebrow={t("faqEyebrow")} title={t("faqTitle")} items={faq} />

      <RelatedReading path="/rulo-isleme-hatlari" locale={locale} />

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
