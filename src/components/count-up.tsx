"use client";

import { useEffect, useRef } from "react";

/**
 * "48+", "%99", "10+" gibi değerleri görünüm alanına girince 0'dan hedefe sayar.
 *
 * SSR çıktısı her zaman NİHAİ değerdir — arama motoru ve JS'siz istemci doğru
 * sayıyı görür; animasyon yalnızca ilerleyici bir süslemedir. İçinde rakam
 * bulunmayan (ör. Arapça-Hint rakamlı) değerler olduğu gibi bırakılır.
 */
export function CountUp({
  value,
  duration = 1400,
  className,
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = value.match(/\d+/);
    if (!m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = parseInt(m[0], 10);
    const fmt = (n: number) => value.replace(m[0], String(n));

    /* Görünene kadar 0 göster ki kullanıcı sayacın "çalıştığını" görsün;
       reduced-motion ve JS'siz durumlarda bu satıra hiç gelinmez. */
    el.textContent = fmt(0);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic — sona doğru yavaşlar
          el.textContent = fmt(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
