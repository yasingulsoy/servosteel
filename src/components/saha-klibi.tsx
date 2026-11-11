"use client";

import { useEffect, useRef } from "react";
import { oynamayaHazir, siradanCik, yuklemeIste } from "@/lib/video-sirasi";

export type SahaKlibiProps = {
  /** public/ altındaki mp4, ör. "/kompakt-hat-dikey.mp4" */
  src: string;
  poster: string;
  width: number;
  height: number;
  baslik: string;
};

/**
 * Sitede barındırılan kısa saha klibi (sessiz, döngü) — ürün sayfasındaki
 * "Sahadan görüntüler" bölümünde YouTube kartlarının yanında durur.
 *
 * Kutu klibin kendi oranını alır (dikey klip dikey kalır), kırpma yok.
 * İndirme sitenin video sırasından geçer (bkz. lib/video-sirasi): ekrana
 * girince yüklenir, takılmadan oynayabilecek hâle gelince başlar, ekrandan
 * çıkınca durur. Hareket azaltmayı seçen ziyaretçide kendiliğinden oynamaz;
 * oynatıcı denetimleri görünür, isterse kendisi başlatır.
 */
export function SahaKlibi({ src, poster, width, height, baslik }: SahaKlibiProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.controls = true;
      return;
    }
    let gorunur = false;
    const oynat = () => {
      if (!gorunur || !v.paused) return;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    v.addEventListener("canplaythrough", oynat);
    const gor = new IntersectionObserver(
      ([e]) => {
        gorunur = e.isIntersecting;
        if (!gorunur) {
          v.pause();
          return;
        }
        yuklemeIste(v, true);
        if (oynamayaHazir(v)) oynat();
      },
      { threshold: 0.25 }
    );
    gor.observe(v);
    return () => {
      gor.disconnect();
      v.removeEventListener("canplaythrough", oynat);
      siradanCik(v);
    };
  }, []);

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="relative bg-shell" style={{ aspectRatio: `${width} / ${height}` }}>
        <video
          ref={ref}
          className="absolute inset-0 size-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          poster={poster}
          width={width}
          height={height}
          aria-label={baslik}
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
      <figcaption className="p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink">{baslik}</h3>
      </figcaption>
    </figure>
  );
}
