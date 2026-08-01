"use client";

import { useEffect, useRef } from "react";

export type VideoBandItem = {
  /** public/ altındaki mp4 yolu, ör. "/dilme-hatti-2.mp4" */
  src: string;
  /** İlk kare olarak gösterilecek poster görseli (video yüklenene kadar) */
  poster: string;
  /** Ekran okuyucular için kısa açıklama */
  label?: string;
};

type BandProps = VideoBandItem & {
  /** Bant yüksekliği (Tailwind sınıfı). Varsayılan tek bant için 90vh. */
  heightClass?: string;
  /**
   * Video üzerine karartma perdesi (hero'daki gibi).
   * Karartma, sıkıştırmadan gelen yumuşamayı ve gürültüyü gizler; ayrıca
   * hero ile aynı görsel dili kurar. 0 = kapalı.
   */
  dim?: 0 | 1 | 2 | 3;
};

/** Karartma yoğunlukları — 1 hafif, 3 hero'ya yakın koyu. */
const DIM = {
  1: "bg-black/20",
  2: "bg-black/35",
  3: "bg-black/50",
} as const;

/**
 * Tam genişlik, metinsiz sinematik video bandı.
 *
 * Performans: preload="none" + IntersectionObserver — video ancak görünüm
 * alanına girince yüklenir ve oynar, çıkınca durur. Böylece sayfa açılışında
 * hiç video baytı inmez.
 */
export function VideoBand({
  src,
  poster,
  label,
  heightClass = "h-[90vh] min-h-[520px]",
  dim = 0,
}: BandProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section className={`relative w-full overflow-hidden bg-shell ${heightClass}`} aria-label={label}>
      <video
        ref={ref}
        className="absolute inset-0 size-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>

      {dim !== 0 && <div aria-hidden className={`absolute inset-0 ${DIM[dim]}`} />}
    </section>
  );
}

/**
 * Birden çok video bandını ARALIKSIZ alt alta dizer.
 * Bantlar arasında hiçbir geçiş/boşluk yoktur — videolar gerçekten bitişiktir.
 */
export function VideoStack({
  items,
  heightClass = "h-[60vh] min-h-[360px]",
  dim = 0,
}: {
  items: VideoBandItem[];
  heightClass?: string;
  dim?: 0 | 1 | 2 | 3;
}) {
  if (!items.length) return null;

  return (
    <div className="w-full">
      {items.map((item) => (
        <VideoBand key={item.src} {...item} heightClass={heightClass} dim={dim} />
      ))}
    </div>
  );
}
