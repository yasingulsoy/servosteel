import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  /** Görüntü oranı: hat/roll-form fotoğrafları için "video" (16:9), makine stüdyo çekimleri için "4/3". */
  ratio?: "video" | "4/3" | "square";
  /** "cover" kırpar (fabrika sahnesi), "contain" tüm makineyi gösterir (beyaz zeminli stüdyo çekimi). */
  fit?: "cover" | "contain";
  /** Ekran üstündeki ana görsel için true (LCP). */
  priority?: boolean;
  sizes?: string;
};

/**
 * Ürün/makine fotoğrafı — next/image ile otomatik optimize (WebP, responsive).
 * Sabit oranlı, yuvarlatılmış çerçeve; farklı kaynak oranlarını tutarlı gösterir.
 */
export function ProductShot({
  src,
  alt,
  ratio = "video",
  fit = "cover",
  priority = false,
  sizes = "(max-width: 1280px) 100vw, 1216px",
}: Props) {
  const ratioClass =
    ratio === "square" ? "aspect-square" : ratio === "4/3" ? "aspect-[4/3]" : "aspect-video";
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-line bg-surface-alt ${ratioClass}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className={fitClass} priority={priority} />
    </div>
  );
}
