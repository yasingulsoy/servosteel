"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import type { TocItem } from "@/lib/toc";

/**
 * İçindekiler — okunan başlığı canlı takip eder (scroll-spy).
 *
 * Tek IntersectionObserver tüm başlıkları izler; görünüm alanının üst
 * şeridine (header yüksekliği kadar aşağıdan) giren SON başlık aktif sayılır.
 * Böylece uzun bölümlerde de doğru madde işaretlenir.
 *
 * xl altında <details> olarak açılır-kapanır: dar ekranda sabit sütun yok,
 * ama içerik yine HTML'de durur (arama motoru ve klavye erişimi korunur).
 */
export function TableOfContents({ items, label }: { items: TocItem[]; label: string }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;
    const nodes = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => n !== null);
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      () => {
        /* Konumu observer girdisinden değil, anlık geometriden okuyoruz:
           hızlı kaydırmada entry'ler eksik gelebiliyor. */
        const top = 96;
        let current = nodes[0];
        for (const n of nodes) {
          if (n.getBoundingClientRect().top <= top) current = n;
          else break;
        }
        setActive(current.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: [0, 1] }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null; // tek başlıklı yazıda içindekiler gereksiz

  const list = (
    <ul className="space-y-1.5 text-sm">
      {items.map((it) => (
        <li key={it.id} className={it.level === 3 ? "ps-4" : undefined}>
          <a
            href={`#${it.id}`}
            aria-current={active === it.id ? "location" : undefined}
            className={`block border-s-2 py-0.5 ps-3 leading-snug transition-colors ${
              active === it.id
                ? "border-accent font-medium text-accent-ink"
                : "border-line text-muted hover:border-muted hover:text-ink"
            }`}
          >
            {it.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Dar ekran: açılır kapanır kart */}
      <details className="group/toc mb-8 rounded-xl border border-line bg-surface-alt p-4 xl:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink [&::-webkit-details-marker]:hidden">
          <List className="size-4 text-accent" strokeWidth={2} aria-hidden />
          {label}
        </summary>
        <nav aria-label={label} className="mt-4">
          {list}
        </nav>
      </details>

      {/* Geniş ekran: sabit yan sütun */}
      <nav aria-label={label} className="sticky top-28 hidden xl:block">
        <p className="font-display flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ink">
          <List className="size-4 text-accent" strokeWidth={2} aria-hidden />
          {label}
        </p>
        <div className="mt-4 max-h-[calc(100svh-12rem)] overflow-y-auto pe-1">{list}</div>
      </nav>
    </>
  );
}
