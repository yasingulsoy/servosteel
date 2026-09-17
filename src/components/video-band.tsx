"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { oynamayaHazir, siradanCik, yuklemeIste } from "@/lib/video-sirasi";

/** İçeriğin durduğu taraf — mantıksal, RTL'de kendiliğinden aynalanır. */
export type BandSide = "start" | "end";

export type VideoBandItem = {
  /** public/ altındaki mp4 yolu, ör. "/alt3.mp4" */
  src: string;
  /** İlk kare olarak gösterilecek poster görseli (video yüklenene kadar) */
  poster: string;
  /** Ekran okuyucular için kısa açıklama */
  label?: string;
  /** İçeriğin durduğu taraf. */
  side?: BandSide;
  /** Videonun üzerine binecek içerik (cam panel vb.) */
  children?: ReactNode;
};

/* Veri hiç inmiyorsa (iOS bazen play() çağrılmadan önden indirmez) bu süre
   sonra oynatma yine de başlatılır; iniyor ama yavaşsa ikinci süre sonra. */
const INMIYOR_MS = 4_000;
const YAVAS_MS = 10_000;

/**
 * Tam genişlik, tam kare video bandı.
 *
 * Boyut: bant videonun kendi oranını (16:9) alır — kırpma YOK. Daha önce sabit
 * ekran yüksekliği veriliyordu; 16:9 video daha basık olduğu için object-cover
 * üstten/alttan kesiyor, videoların başındaki logo jeneriği kırpılıyordu.
 *
 * Karartma: YOK. Videonun üzerinde hiçbir perde yok; üstteki beyaz metnin
 * okunabilirliğini kendi gölgesi taşıyor (globals.css .on-video).
 *
 * YÜKLEME SIRAYLA (bkz. lib/video-sirasi). Bant görünüme 1,5 ekran kala
 * sıraya girer; aynı anda tek video iner. Ekrana giren bant sırayı beklemez.
 * Video, tarayıcı "takılmadan oynar" diyene (canplaythrough) kadar OYNAMAZ —
 * o ana kadar poster durur. Önceden oynatma, veri gelir gelmez başlıyordu;
 * yavaş bağlantıda ziyaretçi takılan videoyu izliyordu.
 *
 * Poster GEÇ bağlanır: `poster` niteliği HTML'de dururken tarayıcı onu
 * preload="none" olsa bile açılışta indirir — sayfanın çok altındaki bantların
 * posterleri de dahil. Bu yüzden poster ancak bant sıraya girerken atanır.
 */
export function VideoBand({ src, poster, label, side = "start", children }: VideoBandItem) {
  const ref = useRef<HTMLVideoElement>(null);
  const [posterSrc, setPosterSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const band = v.closest("[data-video-band]");
    let gorunur = false;
    const yedekler: ReturnType<typeof setTimeout>[] = [];
    const yedekleriSil = () => yedekler.splice(0).forEach(clearTimeout);

    const oynat = () => {
      if (!gorunur || !v.paused) return;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    v.addEventListener("canplaythrough", oynat);

    /* 1,5 ekran kala: poster ve sıraya giriş. */
    const yaklas = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPosterSrc(poster);
        yuklemeIste(v);
        yaklas.disconnect();
      },
      { rootMargin: "0px 0px 150% 0px" }
    );

    /* Ekranda: oynat ya da hazır olmasını bekle; ekrandan çıkınca durdur.
       band-inview cam panelin giriş animasyonunu tetikler. */
    const gor = new IntersectionObserver(
      ([e]) => {
        gorunur = e.isIntersecting;
        yedekleriSil();
        if (!gorunur) {
          band?.classList.remove("band-inview");
          v.pause();
          return;
        }
        band?.classList.add("band-inview");
        setPosterSrc(poster);
        yuklemeIste(v, true);
        if (oynamayaHazir(v)) {
          oynat();
          return;
        }
        yedekler.push(
          setTimeout(() => {
            if (v.readyState <= HTMLMediaElement.HAVE_METADATA) oynat();
          }, INMIYOR_MS),
          setTimeout(oynat, YAVAS_MS)
        );
      },
      { threshold: 0.25 }
    );

    yaklas.observe(v);
    gor.observe(v);
    return () => {
      yaklas.disconnect();
      gor.disconnect();
      yedekleriSil();
      v.removeEventListener("canplaythrough", oynat);
      siradanCik(v);
    };
  }, [poster]);

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
