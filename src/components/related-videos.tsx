import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { VideoCard } from "@/components/video-card";
import { VideoSchema } from "@/components/video-schema";
import { isoDuration, videosForProduct, videoTitleResolver } from "@/lib/videos";
import { SITE_URL } from "@/lib/site";
import { SahaKlibi, type SahaKlibiProps } from "@/components/saha-klibi";
import { Reveal } from "@/components/reveal";

/**
 * Ürün sayfasındaki "Sahadan görüntüler" bölümü.
 *
 * 18 rakip sitenin denetiminde (2026-08-07) video 15'inde vardı ve ürünün
 * yanında duruyordu; bizde yalnızca /videolar arşivindeydi. Alıcıların %70'i
 * karar sürecinde video izliyor — bu bölüm o boşluğu kapatır.
 *
 * Eşleme videosForProduct'tan gelir (başlık doğrulamalı); eşleşme olmayan
 * üründe bölüm HİÇ basılmaz. Başlık ve linkler mevcut çeviri anahtarlarını
 * kullanır (videos.eyebrow, videos.archiveTitle) — yeni anahtar eklenmedi,
 * dokuz dil kendiliğinden doğru.
 */
export type SahaKlipVerisi = SahaKlibiProps & {
  /** Süre (sn) ve siteye eklendiği gün — VideoObject şeması için */
  sec: number;
  tarih: string;
};

/**
 * `klipler`: sitede barındırılan kısa saha klipleri (bkz. saha-klibi.tsx),
 * YouTube kartlarından SONRA gelir. `youtube={false}`: yalnız klipler.
 */
export async function RelatedVideos({
  path,
  ust = false,
  klipler = [],
  youtube = true,
}: {
  path: string;
  ust?: boolean;
  klipler?: SahaKlipVerisi[];
  youtube?: boolean;
}) {
  const items = youtube ? videosForProduct(path) : [];
  const toplam = items.length + klipler.length;
  if (!toplam) return null;

  const t = await getTranslations("videos");
  const titleOf = videoTitleResolver((id) =>
    t.has(`items.${id}`) ? t(`items.${id}`) : undefined
  );

  const baslik = (
    <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{t("eyebrow")}</h2>
  );
  const arsiv = (
    <Link
      href="/videolar"
      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent-ink transition-colors hover:text-accent-strong"
    >
      {t("archiveTitle")}
      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
    </Link>
  );

  /* Dikey klip telefonda ekran genişliğini doldurur ama ekran boyunu aşmaz. */
  const klip = (k: SahaKlipVerisi) => (
    <div key={k.src} className={k.height > k.width ? "mx-auto w-full max-w-sm sm:max-w-none" : undefined}>
      <SahaKlibi src={k.src} poster={k.poster} width={k.width} height={k.height} baslik={k.baslik} />
    </div>
  );

  /* İki öğe ve aralarında klip varsa sütun payları ayrı verilir. Dikey klip
     yatay kartla aynı boya indirildiğinde çok daralıyordu (1216 px'te 295 px
     genişlik, 520 px boy); Yasin "dik olan daha büyük olacak" dedi (11 Kas).
     Yatay 1,9 pay, dikey 1 pay: dikey klip ~410 px genişlik, ~720 px boy;
     yatay kart yanında dikeyde ortalanır. Yatay–yatay ikilide paylar eşit. */
  const oranli = toplam === 2 && klipler.length > 0;
  const dikeyVar = klipler.some((k) => k.height > k.width);
  const kolon = oranli
    ? [...items.map(() => (dikeyVar ? 1.9 : 1)), ...klipler.map((k) => (k.height > k.width || !dikeyVar ? 1 : 1.9))]
        .map((o) => `minmax(0,${o}fr)`)
        .join(" ")
    : undefined;

  /* ust: sayfanın başında — ürün sayfalarında üst fotoğrafların, fotoğraf
     yoksa başlığın hemen altında. Alttaki bölümün boşluğu yerine üst boşluk. */
  return (
    <section className={`mx-auto max-w-7xl px-4 ${ust ? "pt-10 lg:pt-14" : "pb-16 lg:pb-20"}`}>
      {toplam === 1 ? (
        /* Tek video: ikili ızgarada yarısı boş kalıyordu. Solda başlık, sağda büyük video. */
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-12">
          <Reveal>
            {baslik}
            <p className="mt-3 max-w-md leading-relaxed text-muted">{t("desc")}</p>
            <div className="mt-5">{arsiv}</div>
          </Reveal>
          <Reveal delay={90}>
            {items.length ? <VideoCard id={items[0].id} title={titleOf(items[0].id)} sec={items[0].sec} /> : klip(klipler[0])}
          </Reveal>
        </div>
      ) : (
        <>
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              {baslik}
              {arsiv}
            </div>
          </Reveal>
          {oranli ? (
            <Reveal>
              <div
                className="mt-6 grid items-center gap-6 sm:grid-cols-(--kolon)"
                style={{ "--kolon": kolon } as CSSProperties}
              >
                {items.map((v) => (
                  <VideoCard key={v.id} id={v.id} title={titleOf(v.id)} sec={v.sec} />
                ))}
                {klipler.map(klip)}
              </div>
            </Reveal>
          ) : (
            /* Üç video: ikili ızgarada üçüncüsü tek başına yarım satır kalıyordu */
            <Reveal group className={`mt-6 grid gap-6 sm:grid-cols-2 ${toplam === 3 ? "lg:grid-cols-3" : ""}`}>
              {items.map((v) => (
                <VideoCard key={v.id} id={v.id} title={titleOf(v.id)} sec={v.sec} />
              ))}
              {klipler.map(klip)}
            </Reveal>
          )}
        </>
      )}
      <VideoSchema items={items} titleOf={titleOf} />
      {klipler.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              klipler.map((k) => ({
                "@context": "https://schema.org",
                "@type": "VideoObject",
                name: k.baslik,
                description: k.baslik,
                thumbnailUrl: [`${SITE_URL}${k.poster}`],
                contentUrl: `${SITE_URL}${k.src}`,
                uploadDate: k.tarih,
                duration: isoDuration(k.sec),
                width: k.width,
                height: k.height,
              }))
            ),
          }}
        />
      )}
    </section>
  );
}
