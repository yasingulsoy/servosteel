"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sayiOku, sayiYaz } from "@/lib/sayi-girdi";

/* Hesaplayıcıların ortak parçaları — calculators.tsx (kartlar) ve
   coil-calculator.tsx (rulo sac aracı) aynı görünümü paylaşsın diye burada. */

export const field =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

/* Etiket kutunun HEMEN ÜSTÜNDE, kutuya yapışık; iki kutu arası satır boşluğu
   etiket-kutu aralığından belirgin büyük (alanları saran ızgaralar gap-y-4).
   Eskiden etiket küçük ve soluktu, alt satırın etiketi üst satırın kutusuna
   daha yakın duruyordu: "508" yazan kutunun altındaki "Sac kalınlığı"
   etiketi o kutunun adı gibi okunuyordu (Yasin, 2026-11-11). */
const etiketCls = "mb-1.5 block text-sm font-medium leading-snug text-ink";

/**
 * Izgara hücresi: komşu hücrenin etiketi iki satıra kırılırsa kutular yine
 * aynı hizada kalsın diye içerik hücrenin DİBİNE yaslanır (justify-end) —
 * etiket hep kendi kutusunun hemen üstünde.
 */
const hucre = "flex h-full flex-col justify-end";

/** Seçim kutusu gibi sayı dışı alanlar için etiket + alan (etiket alanı sarar) */
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={hucre}>
      <span className={etiketCls}>{label}</span>
      {children}
    </label>
  );
}

/**
 * Sayı kutusu: birim kutunun İÇİNDE sağda, sayı sayfa dilinin biçiminde.
 *
 * Değer ziyaretçinin yazdığı METİN olarak tutulur; yalnızca okunan sayı
 * dışarıdan değişirse (ör. mm ↔ inç geçişi) yeniden biçimlenir. Böylece
 * "2," yazarken virgül silinmez, kutu temizlenince "0" belirmez — boş kutu
 * NaN'dır ve hesap "geçersiz" der.
 */
export function NumField({
  label,
  unit,
  value,
  onChange,
  integer,
  computed,
  badge,
  large,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  /** Adet, strok gibi tam sayı alanları: sayısal klavye, ondalık geçersiz */
  integer?: boolean;
  /** Değer başka alanlardan HESAPLANIYOR: farklı zemin, boşken kırmızı çerçeve yok */
  computed?: boolean;
  /** Etiketin yanındaki küçük not ("hesaplanan" / "girdiğiniz") */
  badge?: string;
  /** Sonuç kutusundaki iri alanlar */
  large?: boolean;
}) {
  const locale = useLocale();
  const id = useId();
  /* Tam sayı alanında ondalık yazılırsa NaN: hesap "geçersiz" der, sessizce yuvarlamaz */
  const oku = (m: string) => {
    const n = sayiOku(m, locale);
    return integer && !Number.isInteger(n) ? NaN : n;
  };
  /* Hesaplanan değer binlik ayırıcıyla okunur ("13.116"); ziyaretçinin
     yazdığı kutuda ayırıcı yok, yazdığı gibi kalır. */
  const [metin, setMetin] = useState(() => sayiYaz(value, locale, computed));
  const [onceki, setOnceki] = useState(value);
  const [oncekiHesap, setOncekiHesap] = useState(computed);
  if (!Object.is(value, onceki) || computed !== oncekiHesap) {
    setOnceki(value);
    setOncekiHesap(computed);
    if (computed || !Object.is(oku(metin), value)) setMetin(sayiYaz(value, locale, computed));
  }
  const gecersiz = !computed && !(oku(metin) >= 0);

  /* type="text": tarayıcının yukarı/aşağı okları ve fare tekerleğiyle değer
     değiştirmesi yok — değer yalnızca klavyeyle yazılır (Yasin, 2026-11-11). */
  return (
    <div className={hucre}>
      <label htmlFor={id} className={`${etiketCls} ${badge ? "flex flex-wrap items-baseline justify-between gap-x-2" : ""}`}>
        {label}
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${
              computed ? "bg-accent/15 text-accent-ink" : "bg-ink text-surface"
            }`}
          >
            {badge}
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          spellCheck={false}
          value={metin}
          aria-invalid={gecersiz || undefined}
          onChange={(e) => {
            setMetin(e.target.value);
            onChange(oku(e.target.value));
          }}
          /* Sınıflar çakışmasın diye her özellik tek yerden seçiliyor (Tailwind'de
             aynı özelliğin iki sınıfından hangisinin kazanacağı sıraya bağlı değil) */
          className={[
            "w-full rounded-lg border ps-3 tabular-nums text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25",
            /* Birim kutunun içinde: yazı birimin altına girmesin */
            !unit ? "pe-3" : large ? "pe-10" : "pe-14",
            /* İri alanlar telefonda iki sütuna "13.116" sığacak boyda */
            large ? "font-display py-3 text-lg font-bold sm:text-2xl" : "py-2.5 text-sm",
            gecersiz
              ? "border-red-400 bg-card dark:border-red-500"
              : computed
                ? "border-dashed border-accent/60 bg-accent/10"
                : "border-line bg-card",
          ].join(" ")}
        />
        {unit && (
          <span className={`pointer-events-none absolute inset-y-0 end-3 flex items-center font-semibold text-muted ${large ? "text-sm" : "text-xs"}`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function Result({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-display shrink-0 text-lg font-bold tabular-nums text-ink">
        {value} <span className="text-xs font-medium text-muted">{unit}</span>
      </span>
    </div>
  );
}

export function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-spotlight
      className="rounded-2xl border border-line bg-card p-6 transition-colors hover:border-accent/40"
    >
      <h2 className="font-display flex items-center gap-2.5 text-lg font-bold uppercase tracking-tight text-ink">
        <Icon className="size-5 text-accent" strokeWidth={1.8} aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Kartın altında, o hesabı fabrikada yapan makineye bağlantı.
 *
 * NEDEN (2026-10-18, GSC son 28 gün): hesaplayıcılar sitenin en çok gösterim
 * alan sayfaları (RU 1.212, TR 784; rulo ağırlığı yazısı EN 1.475) ama sayfada
 * tek ürün bağlantısı yoktu. Rulo ağırlığını hesaplayan kişi sac işleyen firma;
 * sıradaki sorusu "bunu hangi makine yapar". Ad, ürünün mevcut çeviri anahtarından.
 */
export function Related({ href, nameKey }: { href: string; nameKey: string }) {
  const t = useTranslations();
  return (
    <Link
      href={href}
      className="group mt-4 inline-flex flex-wrap items-center gap-x-1.5 text-sm font-semibold text-accent-ink"
    >
      <span className="font-medium text-muted">{t("calc.relatedLine")}:</span>
      {t(nameKey)}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={1.8} aria-hidden />
    </Link>
  );
}

/** Sayıyı yerel biçimde, anlamlı basamakla yazar */
export function useFmt() {
  const locale = useLocale();
  return (n: number, digits = 1) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
}
