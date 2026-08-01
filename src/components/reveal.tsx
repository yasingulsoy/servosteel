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
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
  group = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
  group?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
    <div
      ref={ref}
      {...(group ? { "data-reveal-group": "" } : { "data-reveal": variant })}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
