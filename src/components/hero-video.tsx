"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";

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
  }, []);

  return (
    <section className="relative -mt-20 flex min-h-[600px] items-center overflow-hidden bg-shell text-white h-[100svh]">
      {/* Arka plan videosu */}
      <video
        ref={ref}
        className="absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.jpg"
      >
        <source src="/hero.mp4" type="video/mp4" />
        <source src="/hero.webm" type="video/webm" />
      </video>

      {/* Okunabilirlik için koyu degrade örtüler */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 rtl:bg-gradient-to-l"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-shell via-transparent to-transparent"
      />

      {/* İçerik */}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-24 lg:py-0">
        <div className="max-w-2xl me-auto">
          <h1 className="font-display animate-rise text-4xl font-extrabold uppercase leading-[1.05] tracking-tight [animation-delay:100ms] sm:text-5xl lg:text-6xl xl:text-7xl">
            {t("h1l1")}
            <br />
            <span className="text-accent">{t("h1l2")}</span>
          </h1>
          <div className="animate-rise mt-9 flex flex-wrap gap-4 [animation-delay:300ms]">
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
