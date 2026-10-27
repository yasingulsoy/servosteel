import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { VideoCard } from "@/components/video-card";
import { VideoSchema } from "@/components/video-schema";
import { videosForProduct, videoTitleResolver } from "@/lib/videos";
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
export async function RelatedVideos({ path, ust = false }: { path: string; ust?: boolean }) {
  const items = videosForProduct(path);
  if (!items.length) return null;

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

  /* ust: sayfanın başında — ürün sayfalarında üst fotoğrafların, fotoğraf
     yoksa başlığın hemen altında. Alttaki bölümün boşluğu yerine üst boşluk. */
  return (
    <section className={`mx-auto max-w-7xl px-4 ${ust ? "pt-10 lg:pt-14" : "pb-16 lg:pb-20"}`}>
      {items.length === 1 ? (
        /* Tek video: ikili ızgarada yarısı boş kalıyordu. Solda başlık, sağda büyük video. */
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-12">
          <Reveal>
            {baslik}
            <p className="mt-3 max-w-md leading-relaxed text-muted">{t("desc")}</p>
            <div className="mt-5">{arsiv}</div>
          </Reveal>
          <Reveal delay={90}>
            <VideoCard id={items[0].id} title={titleOf(items[0].id)} sec={items[0].sec} />
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
          <Reveal group className="mt-6 grid gap-6 sm:grid-cols-2">
            {items.map((v) => (
              <VideoCard key={v.id} id={v.id} title={titleOf(v.id)} sec={v.sec} />
            ))}
          </Reveal>
        </>
      )}
      <VideoSchema items={items} titleOf={titleOf} />
    </section>
  );
}
