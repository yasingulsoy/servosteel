"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Hesaplar panelindeki tek hesap satırı.
 *
 * Seçili hesabın klasör listesi her zaman açıktı; hesaba yeniden tıklamak
 * yalnızca Gelen'e götürüyordu, listeyi kapatmanın yolu yoktu (Yasin,
 * 2026-10-11: "açık kalıyor hep, kapanmıyor"). Artık seçili hesaba tıklamak
 * listeyi açıp kapatır; başka hesaba tıklamak eskisi gibi o hesabın Gelen'ine
 * gider ve listesi açık gelir. Klasör listesi sunucuda çizilip `children`
 * olarak gelir — burada yalnız aç/kapa durumu tutulur.
 */
export function HesapAkordeon({
  href,
  secili,
  ad,
  title,
  rozetler,
  children,
}: {
  href: string;
  secili: boolean;
  ad: string;
  title: string;
  rozetler: ReactNode;
  children: ReactNode;
}) {
  const [acik, setAcik] = useState(true);
  const sinif = `flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
    secili ? "bg-surface-alt font-semibold text-ink" : "text-muted hover:bg-surface-alt hover:text-ink"
  }`;

  if (!secili) {
    return (
      <Link href={href} className={sinif} title={title}>
        <span className="min-w-0 flex-1 truncate">{ad}</span>
        {rozetler}
        <ChevronDown className="size-4 shrink-0 -rotate-90 opacity-50 rtl:rotate-90" aria-hidden />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        aria-current="true"
        className={sinif}
        title={title}
      >
        <span className="min-w-0 flex-1 truncate">{ad}</span>
        {rozetler}
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${acik ? "" : "-rotate-90 rtl:rotate-90"}`}
          aria-hidden
        />
      </button>
      {acik ? children : null}
    </>
  );
}
