"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** İçeriğin durduğu taraf — mantıksal, RTL'de kendiliğinden aynalanır. */
export type BandSide = "start" | "end";

export type VideoBandItem = {
  /** public/ altındaki mp4 yolu, ör. "/alt3.mp4" */
  src: string;
  /** İlk kare olarak gösterilecek poster görseli (video yüklenene kadar) */
  poster: string;
  /** Ekran okuyucular için kısa açıklama */
  label?: string;
  /** İçeriğin durduğu taraf. Verilmezse VideoStack sırayla değiştirir. */
  side?: BandSide;
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
 * Karartma: YOK. Videonun üzerinde hiçbir perde yok; üstteki beyaz metnin
 * okunabilirliğini kendi gölgesi taşıyor (globals.css .on-video). Perde harfin
 * çevresini değil tüm kareyi koyultuyordu — ölçünce gölgenin daha iyi kontrast
 * verdiği çıktı, o yüzden perde tamamen kaldırıldı.
 *
 * Performans: preload="none" + IntersectionObserver — video ancak görünüm
 * alanına girince yüklenir ve oynar, çıkınca durur. Böylece sayfa açılışında
 * hiç video baytı inmez.
 */
export function VideoBand({ src, poster, label, side = "start", children }: VideoBandItem) {
  const ref = useRef<HTMLVideoElement>(null);

  /**
   * Poster GEÇ bağlanır.
   *
   * `poster` niteliği HTML'de dururken tarayıcı onu preload="none" olsa bile
   * sayfa açılışında indirir — sayfanın çok altındaki bantların posterleri de
   * dahil. Dört poster ~600 KB ediyordu ve bunun ~470 KB'ı hiç görülmeyebilecek
   * bantlara aitti. Bu yüzden poster ancak bant görünüme YAKLAŞINCA atanır.
   *
   * rootMargin 400px: kullanıcı banda varmadan poster inmiş olur, boş kare
   * görünmez. O ana kadar zaten koyu bg-shell zemin duruyor.
   */
  const [posterSrc, setPosterSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPosterSrc(poster);
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [poster]);

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
      /* data-side: hem perdenin yönünü hem kartın hizasını (globals.css) sürer */
      data-side={side}
      className="relative aspect-video w-full overflow-hidden bg-shell"
      aria-label={label}
    >
      <video
        ref={ref}
        /* Oran bantla aynı olduğu için object-cover kırpmaz; yuvarlama
           farklarında kıl payı taşmayı emmesi için yine de cover.
           video-grade: renk düzeltmesi, dosyaya dokunmadan (bkz. globals.css) */
        className="video-grade absolute inset-0 size-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        poster={posterSrc}
      >
        <source src={src} type="video/mp4" />
      </video>

      {children && <div className="relative size-full">{children}</div>}
    </section>
  );
}

/**
 * Birden çok video bandını ARALIKSIZ alt alta dizer.
 * Bantlar arasında hiçbir geçiş/boşluk yoktur — videolar gerçekten bitişiktir.
 *
 * İçerik tarafı sırayla değişir (sol, sağ, sol …) — üst üste aynı tarafta
 * duran paneller monoton görünüyordu. Bir bant kendi `side` değerini
 * verirse o kazanır.
 */
export function VideoStack({ items }: { items: VideoBandItem[] }) {
  if (!items.length) return null;

  return (
    <div className="w-full">
      {items.map((item, i) => (
        <VideoBand key={item.src} {...item} side={item.side ?? (i % 2 === 0 ? "start" : "end")} />
      ))}
    </div>
  );
}
