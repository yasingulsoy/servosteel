import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sayfaMeta } from "@/i18n/seo";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { InlineQuote } from "@/components/inline-quote";
import { VideoCard } from "@/components/video-card";
import { VideoPlayer } from "@/components/video-player";
import { VideoSchema } from "@/components/video-schema";
import {
  humanDuration,
  izlemeSluglari,
  izlemeVideosu,
  izlemeYolu,
  thumbUrl,
  videoGrubu,
  videoTitleResolver,
  videoUrunYolu,
  watchUrl,
} from "@/lib/videos";

/**
 * Video izleme sayfası — oynatıcı sayfanın ana içeriği (bkz. video-player.tsx,
 * lib/video-izleme.ts). Videonun yanında, videoda görünen ürünün sitedeki
 * GERÇEK özeti ve teknik tablosu durur; uydurma açıklama yazılmaz.
 */

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => izlemeSluglari.map((slug) => ({ locale, slug })));
}

type Tablo = { title: string; head: string[]; rows: string[][]; note?: string };
type Urun = { yol: string; ad: string; ozet: string; tablo?: Tablo };

/** Videodaki ürünün adı, özeti ve (varsa) teknik tablosu — ürün sayfasının kendi metinleri. */
async function urunBilgisi(locale: string, yol: string | undefined): Promise<Urun | undefined> {
  if (!yol) return undefined;
  if (yol === "/dilme-hatlari" || yol === "/boy-kesme-hatlari") {
    const t = await getTranslations({ locale, namespace: yol === "/dilme-hatlari" ? "dilme" : "boykesme" });
    const tablo = t.has("tableRows")
      ? {
          title: t("tableTitle"),
          head: t.raw("tableHead") as string[],
          rows: t.raw("tableRows") as string[][],
          note: t.has("tableNote") ? t("tableNote") : undefined,
        }
      : undefined;
    return { yol, ad: t("title"), ozet: t("desc"), tablo };
  }
  if (yol === "/roll-form-hatlari" || yol === "/makineler") {
    const t = await getTranslations({ locale, namespace: yol === "/makineler" ? "machinesHub" : "hub" });
    return { yol, ad: t("title"), ozet: t("desc") };
  }
  const m = /^\/(roll-form-hatlari|makineler)\/([^/]+)$/.exec(yol);
  if (!m) return undefined;
  const t = await getTranslations({
    locale,
    namespace: `products.${m[1] === "makineler" ? "machines" : "rollform"}.${m[2]}`,
  });
  return { yol, ad: t("name"), ozet: t("short"), tablo: t.has("table") ? (t.raw("table") as Tablo) : undefined };
}

/* Açıklamadaki ürün cümlesi: ürünün sitedeki kısa tanımı. Hat ailesi
   sayfalarının girişi 200+ karakter, açıklamayı taşırır — orada yalnız ad. */
function ozet(urun: Urun | undefined): string {
  if (!urun) return "";
  return urun.ozet.length <= 140 ? urun.ozet : `${urun.ad}.`;
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const v = izlemeVideosu(slug);
  if (!v) return {};
  const t = await getTranslations({ locale, namespace: "videos" });
  const urun = await urunBilgisi(locale, videoUrunYolu(v.id));
  const title = t(`items.${v.id}`);
  return sayfaMeta(locale as AppLocale, `/videolar/${slug}`, {
    baslik: t("watch.metaTitle", { title }),
    aciklama: t("watch.metaDesc", { title, summary: ozet(urun), duration: humanDuration(v.sec) }),
    gorsel: thumbUrl(v.id),
  });
}

export default async function VideoIzlemePage({ params }: Props) {
  const { locale, slug } = await params;
  const v = izlemeVideosu(slug);
  if (!v) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("videos");
  /* Çevrilmiş başlık yoksa YouTube'daki gerçek başlık (bkz. lib/videos.ts videoTitle) */
  const titleOf = videoTitleResolver((id) => (t.has(`items.${id}`) ? t(`items.${id}`) : undefined));
  const grup = videoGrubu(v.id);
  const urun = await urunBilgisi(locale, videoUrunYolu(v.id));
  const title = t(`items.${v.id}`);
  const tarih = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(
    new Date(v.date)
  );

  /* Aynı gruptan öteki videolar (en çok 6); izleme sayfası olanlar önde, böylece
     iç bağlantılar önce öteki izleme sayfalarına gider. */
  const digerleri = (grup?.items ?? [])
    .filter((x) => x.id !== v.id)
    .sort((a, b) => Number(Boolean(izlemeYolu(b.id))) - Number(Boolean(izlemeYolu(a.id))))
    .slice(0, 6);

  return (
    <>
      <VideoSchema
        izlemeSayfasi
        items={[v]}
        titleOf={() => title}
        description={t("watch.metaDesc", { title, summary: ozet(urun), duration: humanDuration(v.sec) })}
      />

      <PageHero
        crumbs={[
          { label: t("metaTitle"), href: "/videolar" },
          { label: title, href: `/videolar/${slug}` },
        ]}
        eyebrow={grup ? t(`groups.${grup.key}`) : t("eyebrow")}
        title={title}
      />

      <section className="mx-auto max-w-5xl px-4 pt-8 lg:pt-10">
        <VideoPlayer id={v.id} title={title} />
        <dl className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-muted">
          <div>
            <dt className="inline">{t("watch.published")}: </dt>
            <dd className="inline">
              <time dateTime={v.date}>{tarih}</time>
            </dd>
          </div>
          <div>
            <dt className="inline">{t("watch.duration")}: </dt>
            <dd className="inline tabular-nums">{humanDuration(v.sec)}</dd>
          </div>
          <a
            href={watchUrl(v.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-semibold text-accent-ink"
          >
            {t("watch.youtube")}
            <ExternalLink className="size-4" strokeWidth={1.8} aria-hidden />
          </a>
        </dl>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t("watch.intro")}</p>
      </section>

      {urun && (
        <section className="mx-auto max-w-5xl px-4 pt-14">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-ink">{t("watch.productTitle")}</p>
            <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight text-ink">{urun.ad}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{urun.ozet}</p>
            {urun.tablo && (
              <>
                <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <caption className="sr-only">{urun.tablo.title}</caption>
                    <thead className="bg-surface-alt">
                      <tr>
                        {urun.tablo.head.map((baslik) => (
                          <th key={baslik} className="px-5 py-3.5 font-semibold text-ink">{baslik}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {urun.tablo.rows.map((satir) => (
                        <tr key={satir[0]} className="border-t border-line">
                          {satir.map((hucre, i) => (
                            <td key={i} className={`px-5 py-3.5 ${i === 0 ? "font-medium text-ink" : "text-muted"}`}>
                              {hucre}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {urun.tablo.note ? <p className="mt-3 text-sm leading-relaxed text-muted">{urun.tablo.note}</p> : null}
              </>
            )}
            <Link
              href={urun.yol}
              className="group mt-6 inline-flex items-center gap-1.5 font-semibold text-accent-ink"
            >
              {t("watch.productCta")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
            </Link>
          </Reveal>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 pt-14">
        <InlineQuote name={urun?.ad} />
      </section>

      {digerleri.length > 0 && grup && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                {t("watch.moreTitle", { group: t(`groups.${grup.key}`) })}
              </h2>
              <Link href="/videolar" className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                {t("watch.allVideos")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
              </Link>
            </div>
          </Reveal>
          <Reveal group className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {digerleri.map((x) => (
              <VideoCard
                key={x.id}
                id={x.id}
                title={titleOf(x.id)}
                sec={x.sec}
              />
            ))}
          </Reveal>
        </section>
      )}

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}
