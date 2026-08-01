"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { VideoScrim } from "@/components/video-scrim";

export type VideoBandItem = {
  /** public/ altındaki mp4 yolu, ör. "/alt3.mp4" */
  src: string;
  /** İlk kare olarak gösterilecek poster görseli (video yüklenene kadar) */
  poster: string;
  /** Ekran okuyucular için kısa açıklama */
  label?: string;
  /** Videonun üzerine binecek içerik (cam panel vb.) */
  children?: ReactNode;
};

/**
 * Tam genişlik, tam kare video bandı.
 *
 * Boyut: bant videonun kendi oranını (16:9) alır — kırpma YOK. Daha önce sabit
 * ekran yüksekliği veriliyordu; 16:9 video daha basık olduğu için object-cover
 * üstten/alttan kesiyor, videoların başındaki logo jeneriği kırpılıyordu.
 *
 * Karartma: hero ile birebir aynı perde (VideoScrim). Seviye ayarı bilerek
 * bileşen dışına açılmadı — tek kaynak olsun, sayfadan sayfaya kaymasın.
 *
 * Performans: preload="none" + IntersectionObserver — video ancak görünüm
 * alanına girince yüklenir ve oynar, çıkınca durur. Böylece sayfa açılışında
 * hiç video baytı inmez.
 */
export function VideoBand({ src, poster, label, children }: VideoBandItem) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        /* band-inview: cam panelin giriş animasyonunu tetikler; banttan
           çıkıp geri gelince panel yeniden süzülerek girer. */
        const band = v.closest("[data-video-band]");
        if (entry.isIntersecting) {
          band?.classList.add("band-inview");
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          band?.classList.remove("band-inview");
          v.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section
      data-video-band
      className="relative aspect-video w-full overflow-hidden bg-shell"
      aria-label={label}
    >
      <video
        ref={ref}
        /* Oran bantla aynı olduğu için object-cover kırpmaz; yuvarlama
           farklarında kıl payı taşmayı emmesi için yine de cover. */
        className="absolute inset-0 size-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Karartma perdesi — hero ile ortak (bkz. video-scrim.tsx) */}
      <VideoScrim />

      {children && <div className="relative size-full">{children}</div>}
    </section>
  );
}

/**
 * Birden çok video bandını ARALIKSIZ alt alta dizer.
 * Bantlar arasında hiçbir geçiş/boşluk yoktur — videolar gerçekten bitişiktir.
 */
export function VideoStack({ items }: { items: VideoBandItem[] }) {
  if (!items.length) return null;

  return (
    <div className="w-full">
      {items.map((item) => (
        <VideoBand key={item.src} {...item} />
      ))}
    </div>
  );
}
