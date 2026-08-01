"use client";

import { Fragment, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";
import { VideoScrim } from "@/components/video-scrim";

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
        className="absolute inset-0 size-full object-cover"
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

      {/* Karartma perdesi — tüm video bantlarıyla ortak (bkz. video-scrim.tsx) */}
      <VideoScrim />

      {/* İçerik — kaydırdıkça geride kalıp erir (video değil, sadece metin) */}
      <div className="hero-scroll-fade relative mx-auto w-full max-w-7xl px-4 py-24 lg:py-0">
        <div className="max-w-2xl me-auto">
          <h1
            className="font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}
          >
            <Words text={t("h1l1")} base={80} />
            <br />
            <span className="text-accent">
              <Words text={t("h1l2")} base={80 + t("h1l1").split(" ").length * 70 + 120} />
            </span>
          </h1>
          <div className="animate-rise mt-9 flex flex-wrap gap-4 [animation-delay:520ms]">
            <SpecularButton href="/teklif-al" variant="gold" size="lg">
              {t("cta1")}
            </SpecularButton>
            <SpecularButton href="/videolar" variant="ghost" size="lg" className="text-white">
              <Play className="size-4 fill-current" aria-hidden />
              {t("videoCta")}
            </SpecularButton>
          </div>
        </div>
      </div>

      {/* Aşağı kaydır göstergesi */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block" aria-hidden>
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1.5">
          <span className="size-1.5 animate-bounce rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}
