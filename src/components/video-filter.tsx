"use client";

import { useEffect, useState, type ReactNode } from "react";

export type FilterPill = { key: string; label: string };
export type FilterSection = { key: string; node: ReactNode };

/**
 * Video bölümü filtresi — hap şeklinde tuşlar, basınca yalnızca o bölüm kalır.
 *
 * SUNUCUDA HEPSİ BASILIR. Bölümler burada üretilmiyor, hazır düğüm olarak
 * geliyor; bu bileşen yalnızca hangisinin gizleneceğine karar veriyor. Yani
 * ilk HTML'de altı bölümün tamamı var — arama motoru da JavaScript'i kapalı
 * ziyaretçi de her şeyi görüyor, filtre üstüne binen bir kolaylık.
 *
 * Seçim URL'in hash'inde tutuluyor (/videolar#slitting):
 *  - paylaşılabilir ve yer imine eklenebilir
 *  - ana sayfadaki video bantları doğrudan kendi bölümüne bağlanabiliyor
 *  - hash sunucuya gitmediği için sayfa statik üretilmeye devam ediyor
 *    (`searchParams` kullanılsaydı dokuz dilin tamamı dinamiğe düşerdi)
 */
export function VideoFilter({
  pills,
  sections,
  allLabel,
}: {
  pills: FilterPill[];
  sections: FilterSection[];
  /** "Tümü" tuşunun metni */
  allLabel: string;
}) {
  const [aktif, setAktif] = useState<string | null>(null);

  /* Hash'i mount'ta oku ve sonrasında dinle. Geri/ileri tuşu ve dışarıdan
     gelen /videolar#ctl bağlantısı da böyle çalışıyor. */
  useEffect(() => {
    const oku = () => {
      const h = window.location.hash.replace("#", "");
      setAktif(pills.some((p) => p.key === h) ? h : null);
    };
    oku();
    window.addEventListener("hashchange", oku);
    return () => window.removeEventListener("hashchange", oku);
  }, [pills]);

  const sec = (key: string | null) => {
    setAktif(key);
    /* pushState: hash değişiyor ama sayfa zıplamıyor. history.pushState
       hashchange tetiklemediği için state'i yukarıda elle yazıyoruz. */
    const url = key ? `#${key}` : window.location.pathname;
    window.history.pushState(null, "", url);
  };

  const tus = (secili: boolean) =>
    `rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
      secili
        ? "border-shell bg-shell text-white"
        : "border-line bg-card text-ink hover:border-accent/50 hover:text-accent-ink"
    }`;

  return (
    <>
      {/* Tuşlar bir grup; hangisinin seçili olduğunu aria-pressed taşıyor,
          böylece ekran okuyucu da durumu duyuruyor. */}
      <div className="flex flex-wrap gap-2.5" role="group" aria-label={allLabel}>
        <button type="button" onClick={() => sec(null)} aria-pressed={aktif === null} className={tus(aktif === null)}>
          {allLabel}
        </button>
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => sec(p.key)}
            aria-pressed={aktif === p.key}
            className={tus(aktif === p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {sections.map((s, i) => {
        const gizli = aktif !== null && aktif !== s.key;
        return (
          <div
            key={s.key}
            id={s.key}
            hidden={gizli}
            /* Filtre açıkken görünen tek bölüm en üstte durmalı; aksi hâlde
               üstündeki gizli bölümlerin boşluğu kalıyordu. */
            className={gizli ? undefined : i > 0 && aktif === null ? "mt-16" : "mt-12"}
          >
            {s.node}
          </div>
        );
      })}
    </>
  );
}
