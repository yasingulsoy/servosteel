import { embedUrl, isoDuration, izlemeYolu, thumbUrl, watchUrl, type VideoItem } from "@/lib/videos";

/**
 * VideoObject JSON-LD — Google'ın video zengin sonuçları için.
 *
 * Zorunlu alanlar (name, thumbnailUrl, uploadDate) eksiksiz doldurulur;
 * tarih ve süre YouTube'un gerçek metadata'sından gelir (src/lib/videos.ts).
 * Tahmini tarih yazmak şemayı geçersiz kılar, o yüzden uydurulmaz.
 *
 * İzleme sayfası olan video (lib/video-izleme.ts) YALNIZ kendi sayfasında
 * ilan edilir (`izlemeSayfasi`). Liste, ürün ve sektör sayfalarında atlanır:
 * oynatıcı orada yok, Google o sayfaları "video ana içerik değil" diye
 * eliyordu (11 Ekim: 229 video) ve aynı videoyu birden çok sayfada ilan
 * etmek asıl sayfayı bulanıklaştırır.
 */
export function VideoSchema({
  items,
  titleOf,
  description,
  izlemeSayfasi = false,
}: {
  items: VideoItem[];
  titleOf: (id: string) => string;
  description?: string;
  izlemeSayfasi?: boolean;
}) {
  const ilan = izlemeSayfasi ? items : items.filter((v) => !izlemeYolu(v.id));
  if (!ilan.length) return null;

  const jsonLd = ilan.map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: titleOf(v.id),
    description: description ?? titleOf(v.id),
    thumbnailUrl: [thumbUrl(v.id)],
    uploadDate: v.date,
    duration: isoDuration(v.sec),
    embedUrl: embedUrl(v.id),
    contentUrl: watchUrl(v.id),
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
