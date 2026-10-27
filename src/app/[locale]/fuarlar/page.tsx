import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowDown, CalendarDays, Handshake, MapPin, Store } from "lucide-react";
import { localePath, sayfaMeta } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { VideoCard } from "@/components/video-card";
import { SpecularButton } from "@/components/specular-button";
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

/* Başlık bandındaki bilgi rozeti */
function Rozet({ icon: Icon, children, vurgulu = false }: { icon: typeof MapPin; children: React.ReactNode; vurgulu?: boolean }) {
  return (
    <li
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
        vurgulu ? "bg-accent font-semibold text-zinc-950" : "border border-white/15 bg-white/5 text-zinc-200"
      }`}
    >
      <Icon className={`size-4 shrink-0 ${vurgulu ? "" : "text-accent"}`} strokeWidth={1.9} aria-hidden />
      {children}
    </li>
  );
}

export default async function FuarlarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fairs");
  const tv = await getTranslations("videos");
  const tn = await getTranslations("nav");

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

      <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        {/* Özet şerit — her kart kendi fuarına atlar */}
        <nav aria-label={t("title")}>
          <ul className="grid gap-3 sm:grid-cols-3">
            {fuarlar.map((f) => (
              <li key={f.slug}>
                <a
                  href={`#${f.slug}`}
                  className="group flex h-full items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/5"
                >
                  <span className="min-w-0">
                    <span className="font-display block text-3xl font-extrabold leading-none text-accent-ink">
                      {f.baslangic.slice(0, 4)}
                    </span>
                    <span className="mt-2 block truncate font-semibold text-ink">{f.ad}</span>
                    <span className="mt-0.5 block text-sm text-muted">{tarihAraligi(f, locale)}</span>
                  </span>
                  <ArrowDown
                    className="size-5 shrink-0 text-muted transition-transform group-hover:translate-y-0.5 group-hover:text-accent"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 space-y-10 lg:mt-16 lg:space-y-14">
          {fuarlar.map((f) => {
            /* Afiş de videolar gibi dik (9:16): ikisi aynı şeritte, eşit karelerde durur */
            const dikMedya = [
              ...(f.afis ? [{ tur: "afis" as const }] : []),
              ...f.videolar.filter((v) => v.height > v.width).map((v) => ({ tur: "video" as const, v })),
            ];
            const yatayVideo = f.videolar.filter((v) => v.height <= v.width);
            return (
              <Reveal key={f.slug}>
                <article id={f.slug} className="scroll-mt-28 overflow-hidden rounded-3xl border border-line bg-card">
                  {/* Başlık bandı */}
                  <header className="relative overflow-hidden bg-shell px-6 py-8 text-white sm:px-10 sm:py-10">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-accent/15 blur-3xl"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(125deg,transparent_0_22px,#fff_22px_23px)]"
                    />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                          <CalendarDays className="size-4" strokeWidth={2} aria-hidden />
                          <span className="sr-only">{t("date")}: </span>
                          {tarihAraligi(f, locale)}
                        </p>
                        <h2 className="font-display mt-3 text-3xl font-extrabold uppercase leading-none tracking-tight sm:text-4xl">
                          {f.ad}
                        </h2>
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        <Rozet icon={MapPin}>
                          <span className="sr-only">{t("venue")}: </span>
                          {t(`items.${f.slug}.place`)}
                        </Rozet>
                        {f.stand && (
                          <Rozet icon={Store} vurgulu>
                            {f.salon ? t("hallBooth", { hall: f.salon, booth: f.stand }) : t("booth", { booth: f.stand })}
                          </Rozet>
                        )}
                        {f.ortak && <Rozet icon={Handshake}>{t("partner", { name: f.ortak })}</Rozet>}
                      </ul>
                    </div>
                  </header>

                  <div className="space-y-8 p-6 sm:p-10">
                    <div
                      className={
                        dikMedya.length > 0
                          ? "grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_50rem] lg:gap-10"
                          : ""
                      }
                    >
                      {/* Açıklama — dik medya varsa solda, medyanın yanında yapışık durur */}
                      <div className={dikMedya.length > 0 ? "min-w-0 lg:sticky lg:top-28 lg:self-start" : ""}>
                        <p className="max-w-3xl text-lg leading-relaxed text-ink/80">{t(`items.${f.slug}.text`)}</p>
                        {dikMedya.length > 0 && (
                          <SpecularButton href="/teklif-al" variant="gold" size="md" className="mt-6">
                            {tn("quote")}
                          </SpecularButton>
                        )}
                      </div>

                      {/* Dik medya: afiş + telefon videoları, aynı 9:16 karelerde.
                          Masaüstünde 3×2 ızgara; telefonda alt alta, tam genişlikte
                          (ikili ızgarada videolar izlenemeyecek kadar küçüktü; yana
                          kaydırma da Yasin'in isteğiyle bırakıldı, 28 Eki). */}
                      {dikMedya.length > 0 && (
                        <div className="min-w-0">
                          <h3 className="sr-only">{t("videos")}</h3>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                            {dikMedya.map((m, i) =>
                              m.tur === "afis" && f.afis ? (
                                <a
                                  key="afis"
                                  href={fuarDosyasi(f.slug, f.afis.file)}
                                  target="_blank"
                                  rel="noopener"
                                  className="relative block aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-surface-alt"
                                >
                                  <Image
                                    src={fuarDosyasi(f.slug, f.afis.file)}
                                    alt={t("posterAlt", { fair: f.ad })}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 270px"
                                    className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                                  />
                                </a>
                              ) : m.tur === "video" ? (
                                /* Sunucudan oynar; tıklanınca yüklenir (preload="none") */
                                <video
                                  key={m.v.file}
                                  controls
                                  playsInline
                                  preload="none"
                                  width={m.v.width}
                                  height={m.v.height}
                                  poster={m.v.poster ? fuarDosyasi(f.slug, m.v.poster) : undefined}
                                  aria-label={t("videoLabel", { fair: f.ad, n: f.afis ? i : i + 1 })}
                                  className="aspect-[9/16] w-full rounded-2xl border border-line bg-shell object-cover"
                                >
                                  <source src={fuarDosyasi(f.slug, m.v.file)} type="video/mp4" />
                                </video>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {(yatayVideo.length > 0 || f.youtube.length > 0) && (
                      <div className="grid gap-6 sm:grid-cols-2">
                        {yatayVideo.map((v) => (
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
                    )}

                    {f.fotolar.length > 0 && (
                      <div>
                        <h3 className="sr-only">{t("photos")}</h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      <CtaBand />
    </>
  );
}
