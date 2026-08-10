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

    /* Eşik ORANDIR, yani elemanın kendi yüksekliğine göre hesaplanır — çok uzun
       bir kapsayıcıda %15 ekrana hiç sığmayabilir ve observer HİÇ tetiklenmez.
       Videolar sayfasındaki 78 kartlık arşiv ızgarası 26.000 piksel; %15'i
       ~3.900 piksel ederken ekran ~900 piksel, dolayısıyla o bölüm kalıcı
       olarak görünmez kalıyordu.

       Çözüm: %15'in istediği piksel, ekranın makul bir kısmını aşıyorsa eşik
       ekrana göre yeniden hesaplanır. Normal boydaki bloklarda (bir-iki ekran)
       koşul hiç devreye girmez, davranış aynen korunur. */
    const yukseklik = el.getBoundingClientRect().height;
    const tavan = window.innerHeight * 0.6;
    const esik =
      yukseklik > 0 && yukseklik * 0.15 > tavan ? tavan / yukseklik : 0.15;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          io.disconnect();
        }
      },
      { threshold: esik, rootMargin: "0px 0px -40px 0px" }
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
