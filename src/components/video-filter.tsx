"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  const tusKutusu = useRef<HTMLDivElement>(null);

  /* Hash'i mount'ta oku ve sonrasında dinle. Geri/ileri tuşu ve dışarıdan
     gelen /videolar#ctl bağlantısı da böyle çalışıyor. */
  useEffect(() => {
    const oku = () => {
      const h = window.location.hash.replace("#", "");
      const bulundu = pills.some((p) => p.key === h);
      setAktif(bulundu ? h : null);

      /* Dışarıdan hash'li gelindiğinde tarayıcı kendi başına bir yere kaydırmış
         olabilir; ardından filtre diğer bölümleri gizleyip sayfayı kısaltınca
         ekranda boşluk kalıyordu. Bölümler gizlendikten SONRA tuşların olduğu
         yere dönülüyor — kullanıcı hem seçili filtreyi hem sonucu görüyor. */
      if (bulundu) {
        requestAnimationFrame(() =>
          tusKutusu.current?.scrollIntoView({ block: "start", behavior: "auto" })
        );
      }
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

  /* shrink-0 + whitespace-nowrap: tuş satır atlamıyor, uzun etiket bölünmüyor. */
  const tus = (secili: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
      secili
        ? "border-shell bg-shell text-white"
        : "border-line bg-card text-ink hover:border-accent/50 hover:text-accent-ink"
    }`;

  return (
    <>
      {/* TEK SIRA. Yedi etiketin en uzunu "Pres Besleme Sistemleri ve Kompakt
          Hatlar" — hiçbir ekrana yan yana sığmıyor, sarınca da iki satırlık
          dağınık bir blok oluyordu. Sarma yerine yatay kaydırma: sıra bozulmuyor,
          dar ekranda parmakla kaydırılıyor.

          -mx-4/px-4: satır kabın kenarına kadar taşıyor, böylece sağda kesilen
          tuş "devamı var" sinyali veriyor. Kaydırma çubuğu gizli, kendi çizgisi
          tasarımı bozuyordu.

          aria-label + role=group: ekran okuyucu bunu tek bir filtre grubu olarak
          duyuruyor, aria-pressed de hangisinin seçili olduğunu söylüyor. */}
      <div
        className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={allLabel}
        ref={tusKutusu}
      >
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
            className={gizli ? undefined : i > 0 && aktif === null ? "mt-16" : "mt-9"}
          >
            {s.node}
          </div>
        );
      })}
    </>
  );
}
