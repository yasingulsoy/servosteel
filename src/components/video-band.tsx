"use client";

import { useEffect, useRef } from "react";

/**
 * Alt bölüm için sinematik tam-genişlik video bandı (metinsiz).
 * Yalnızca görünüm alanına girince oynar/yüklenir (preload="none") — gereksiz
 * bant genişliği harcamaz. Kenarlar komşu bölümlere yumuşak kaynaşır.
 */
export function VideoBand() {
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
    <section className="relative h-[90vh] min-h-[520px] w-full overflow-hidden bg-shell">
      <video
        ref={ref}
        className="absolute inset-0 size-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        poster="/alt-poster.jpg"
      >
        <source src="/alt.mp4" type="video/mp4" />
      </video>

      {/* kenar kaynaşması: üstte beyaz bölüme, altta açık gri bölüme yumuşak geçiş */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-surface to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-alt to-transparent" />
    </section>
  );
}
