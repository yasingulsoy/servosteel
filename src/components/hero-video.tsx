"use client";

import { Fragment, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";

/**
 * Başlığı kelimelere böler; her kelime kendi maskesinin içinden yukarı
 * kayarak girer (CSS: .word-mask). Kelime arası boşluklar maskenin DIŞINDA
 * kalır ki satır kaydırma ve ekran okuyucu davranışı hiç değişmesin.
 */
function Words({ text, base = 0, step = 70 }: { text: string; base?: number; step?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="word-mask">
            <span style={{ "--wd": `${base + i * step}ms` } as React.CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Tam ekran arka plan videolu hero.
 * Video dosyası public/hero.mp4 (kısa, sessiz, döngü) olarak eklenince otomatik oynar.
 * Dosya yoksa marka koyu zemini + poster görünür — kırık görünmez.
 */
export function HeroVideo() {
  const t = useTranslations("home");
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // React bazı tarayıcılarda muted attribute'unu güvenilir set etmez; autoplay için garanti
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});

    /* Alt videolara geçince hero durur, dönünce kaldığı yerden sürer —
       görünmeyen video boşa çözümleme yapmaz (bantlarla aynı davranış). */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const pp = v.play();
          if (pp && typeof pp.catch === "function") pp.catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section
      data-video-band
      className="relative -mt-20 flex min-h-[600px] items-center overflow-hidden bg-shell text-white h-[100svh]"
    >
      {/* Arka plan videosu */}
      <video
        ref={ref}
        /* video-grade: renk düzeltmesi, dosyaya dokunmadan (bkz. globals.css) */
        className="video-grade absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        /* preload="none": 7,5 MB'lık video kritik yükleme yolundan çıkarılır.
           Poster hemen boyanır, video oynatma useEffect'teki play() ile başlar.
           preload="auto" iken mobilde LCP 6,3 sn'ye çıkıyordu. */
        preload="none"
        poster="/hero-poster.jpg"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* İçerik — kaydırdıkça geride kalıp erir (video değil, sadece metin) */}
      <div className="hero-scroll-fade relative mx-auto w-full max-w-7xl px-4 py-24 lg:py-0">
        <div className="max-w-2xl me-auto">
          {/* on-video: perde kalktığı için okunabilirliği bu gölge taşıyor */}
          {/* Tek satır: hattın adı. Üstündeki "48 ülkede çalışan" gibi vurgu
              cümlesi kaldırıldı — aynı iddia hemen altındaki sayı şeridinde
              zaten duruyor, başlıkta ikinci kez söylenmesi hat adını küçültüyordu. */}
          <h1 className="on-video font-display text-accent text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            <Words text={t("h1l2")} base={80} />
          </h1>
          <div className="animate-rise mt-9 flex flex-wrap gap-4 [animation-delay:520ms]">
            <SpecularButton href="/teklif-al" variant="gold" size="lg">
              {t("cta1")}
            </SpecularButton>
            {/* Ghost butonun kendi zemini yok, metni doğrudan videonun üstünde.
                Perde kalkınca kenarlığın %30'u ışıklı karede kayboluyordu. */}
            {/* #rollform: bu bandın videosu roll form hattı, başlığı da öyle
                diyor — tuşa basan da roll form videolarını görsün, tüm kanalı
                değil. Aşağıdaki bantlarla aynı davranış (video-band-content). */}
            <SpecularButton
              href="/videolar#rollform"
              variant="ghost"
              size="lg"
              className="on-video-sm text-white border-white/60!"
            >
              <Play className="size-4 fill-current" aria-hidden />
              {t("videoCta")}
            </SpecularButton>
          </div>
        </div>
      </div>

      {/* Aşağı kaydır göstergesi — perde yokken kendi gölgesiyle ayrışır */}
      <div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] lg:block"
        aria-hidden
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/70 p-1.5">
          <span className="size-1.5 animate-bounce rounded-full bg-white" />
        </div>
      </div>
    </section>
  );
}
