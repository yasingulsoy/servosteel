"use client";

import { useEffect } from "react";

/**
 * "Akla gelmeyecek" sekme davranışları:
 *
 * 1) Sekme arka plana düşünce TÜM videolar durur — arka planda boşa
 *    çözümleme/pil tüketimi olmaz. Geri dönünce yalnızca o an görünüm
 *    alanında duran videolar kaldığı yerden sürer.
 * 2) Sekme başlığının önüne ⏸ gelir — kullanıcı onlarca sekme arasında
 *    "duraklattığı" siteyi tek bakışta bulur. Dil bağımsız (simge).
 */
export function PageAttention() {
  useEffect(() => {
    const wasPlaying = new Set<HTMLVideoElement>();

    const onVisibility = () => {
      const videos = document.querySelectorAll<HTMLVideoElement>("[data-video-band] video");

      if (document.hidden) {
        wasPlaying.clear();
        videos.forEach((v) => {
          if (!v.paused) {
            wasPlaying.add(v);
            v.pause();
          }
        });
        if (!document.title.startsWith("⏸ ")) document.title = `⏸ ${document.title}`;
      } else {
        if (document.title.startsWith("⏸ ")) document.title = document.title.slice(2);
        wasPlaying.forEach((v) => {
          const r = v.getBoundingClientRect();
          const inView = r.bottom > 0 && r.top < window.innerHeight;
          if (inView) v.play().catch(() => {});
        });
        wasPlaying.clear();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}
