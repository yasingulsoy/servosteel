"use client";

import { useEffect, useRef } from "react";

type Variant = "up" | "left" | "right" | "zoom";

/**
 * Görünüm alanına girince yumuşakça beliren sarmalayıcı (CSS: [data-reveal]).
 *
 * variant — giriş yönü: "up" (varsayılan), "left", "right", "zoom".
 *           Yatay yönler RTL'de otomatik aynalanır (globals.css).
 * group   — true ise kapsayıcı değil ÇOCUKLAR animasyonlanır: tek observer,
 *           çocuklar 90ms arayla sırayla belirir (kart ızgaraları için).
 * as      — basılacak etiket. Varsayılan `div` her yerde uymuyor: `<ol>` ile
 *           `<li>` ARASINA giren bir div listeyi geçersiz kılıyor ve ekran
 *           okuyucu "4 öğeli liste" diye duyuramıyor. Böyle yerlerde
 *           `as="ol"` verilip animasyon liste öğesinin kendisine uygulanır.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
  group = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
  group?: boolean;
  as?: "div" | "ol" | "ul" | "section";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      {...(group ? { "data-reveal-group": "" } : { "data-reveal": variant })}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
