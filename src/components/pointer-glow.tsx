"use client";

import { useEffect } from "react";

/**
 * [data-spotlight] işaretli kartlarda imleci takip eden altın ışık.
 *
 * Kart başına dinleyici yerine TEK global pointermove: hedefin en yakın
 * spotlight atası bulunur, ışığın konumu CSS değişkenine yazılır; çizimi
 * tamamen CSS yapar ([data-spotlight]::after). Bileşen hiçbir şey çizmez.
 */
export function PointerGlow() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const card = target?.closest?.("[data-spotlight]") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--px", `${e.clientX - r.left}px`);
      card.style.setProperty("--py", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
