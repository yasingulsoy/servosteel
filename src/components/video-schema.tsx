import { embedUrl, isoDuration, thumbUrl, watchUrl, type VideoItem } from "@/lib/videos";

/**
 * VideoObject JSON-LD — Google'ın video zengin sonuçları için.
 *
 * Zorunlu alanlar (name, thumbnailUrl, uploadDate) eksiksiz doldurulur;
 * tarih ve süre YouTube'un gerçek metadata'sından gelir (src/lib/videos.ts).
 * Tahmini tarih yazmak şemayı geçersiz kılar, o yüzden uydurulmaz.
 */
export function VideoSchema({
  items,
  titleOf,
  description,
}: {
  items: VideoItem[];
  titleOf: (id: string) => string;
  description?: string;
}) {
  if (!items.length) return null;

  const jsonLd = items.map((v) => ({
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
