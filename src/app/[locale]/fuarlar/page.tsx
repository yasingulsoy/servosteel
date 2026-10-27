import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { CalendarDays, Handshake, MapPin, Store } from "lucide-react";
import { localePath, sayfaMeta } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { VideoCard } from "@/components/video-card";
import { fuarlar, fuarDosyasi, type Fuar } from "@/lib/fuarlar";
import { videoMeta } from "@/lib/videos";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "fairs" });
  const afisli = fuarlar.find((f) => f.afis);
  return sayfaMeta(locale as AppLocale, "/fuarlar", {
    baslik: t("metaTitle"),
    aciklama: t("metaDesc"),
    gorsel: afisli?.afis ? fuarDosyasi(afisli.slug, afisli.afis.file) : undefined,
  });
}

/* "20–23 Ekim 2026" — ay ve yıl tekrarını dilin kendi kuralı ayıklar */
function tarihAraligi(f: Fuar, locale: string) {
  const bicim = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return bicim.formatRange(new Date(`${f.baslangic}T00:00:00Z`), new Date(`${f.bitis}T00:00:00Z`));
}

export default async function FuarlarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fairs");
  const tv = await getTranslations("videos");

  /* Katıldığımız fuarlar — her biri ayrı ExhibitionEvent. Düzenleyen biz
     değiliz; `organizer` bilerek yok, stand bilgisi açıklamada. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}${localePath(locale as AppLocale, "/fuarlar")}#fairs`,
    name: t("title"),
    itemListElement: fuarlar.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "ExhibitionEvent",
        name: f.ad,
        startDate: f.baslangic,
        endDate: f.bitis,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: f.mekan.ad,
          address: { "@type": "PostalAddress", addressLocality: f.mekan.sehir, addressCountry: f.mekan.ulke },
        },
        description: t(`items.${f.slug}.text`),
        ...(f.afis ? { image: `${SITE_URL}${fuarDosyasi(f.slug, f.afis.file)}` } : {}),
        performer: { "@type": "Organization", name: SITE_NAME, "@id": `${SITE_URL}/#organization` },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        crumbs={[{ label: t("title"), href: "/fuarlar" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 lg:space-y-24 lg:py-20">
        {fuarlar.map((f) => {
          const yer = t(`items.${f.slug}.place`);
          return (
            <article key={f.slug} id={f.slug} className="scroll-mt-28">
              <div className={`grid gap-10 ${f.afis ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
                <div className="min-w-0">
                  <Reveal>
                    <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">{f.ad}</h2>
                    <ul className="mt-6 space-y-3 text-sm text-ink">
                      <li className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                        <span>
                          <span className="sr-only">{t("date")}: </span>
                          {tarihAraligi(f, locale)}
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                        <span>
                          <span className="sr-only">{t("venue")}: </span>
                          {yer}
                        </span>
                      </li>
                      {f.stand && (
                        <li className="flex items-start gap-3">
                          <Store className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                          <span className="font-semibold">
                            {f.salon ? t("hallBooth", { hall: f.salon, booth: f.stand }) : t("booth", { booth: f.stand })}
                          </span>
                        </li>
                      )}
                      {f.ortak && (
                        <li className="flex items-start gap-3">
                          <Handshake className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                          <span>{t("partner", { name: f.ortak })}</span>
                        </li>
                      )}
                    </ul>
                    <p className="mt-6 max-w-2xl leading-relaxed text-muted">{t(`items.${f.slug}.text`)}</p>
                  </Reveal>

                  {f.fotolar.length > 0 && (
                    <div className="mt-10">
                      <h3 className="font-semibold text-ink">{t("photos")}</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {f.fotolar.map((g, i) => (
                          <a
                            key={g.file}
                            href={fuarDosyasi(f.slug, g.file)}
                            target="_blank"
                            rel="noopener"
                            className="relative block aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface-alt"
                          >
                            <Image
                              src={fuarDosyasi(f.slug, g.file)}
                              alt={t("photoAlt", { fair: f.ad, n: i + 1 })}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                              className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(f.videolar.length > 0 || f.youtube.length > 0) && (
                    <div className="mt-10">
                      <h3 className="font-semibold text-ink">{t("videos")}</h3>
                      <div className="mt-4 grid gap-6 sm:grid-cols-2">
                        {/* Sunucudan oynayan videolar: tıklanınca yüklenir (preload="none"),
                            sayfa açılışında bayt indirilmez. */}
                        {f.videolar.map((v) => (
                          <video
                            key={v.file}
                            controls
                            playsInline
                            preload="none"
                            width={v.width}
                            height={v.height}
                            poster={v.poster ? fuarDosyasi(f.slug, v.poster) : undefined}
                            className="h-auto w-full rounded-2xl border border-line bg-shell"
                          >
                            <source src={fuarDosyasi(f.slug, v.file)} type="video/mp4" />
                          </video>
                        ))}
                        {f.youtube.map((id) => {
                          const v = videoMeta(id);
                          if (!v) return null;
                          const baslik = tv.has(`items.${id}`) ? tv(`items.${id}`) : f.ad;
                          return <VideoCard key={id} id={id} title={baslik} sec={v.sec} />;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {f.afis && (
                  <Reveal delay={90}>
                    <Image
                      src={fuarDosyasi(f.slug, f.afis.file)}
                      alt={t("posterAlt", { fair: f.ad })}
                      width={f.afis.width}
                      height={f.afis.height}
                      sizes="(max-width: 1024px) 100vw, 360px"
                      className="mx-auto h-auto w-full max-w-[360px] rounded-2xl border border-line shadow-xl shadow-black/10"
                    />
                  </Reveal>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <CtaBand />
    </>
  );
}
