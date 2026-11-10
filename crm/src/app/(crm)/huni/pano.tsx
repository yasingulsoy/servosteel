"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarDays, ListChecks, User } from "lucide-react";
import { KANAL, TAKIP, TAKIP_RENK } from "@/lib/sabitler";
import { asamaDegistir } from "./actions";

export type HuniKarti = {
  id: number;
  firmaId: number;
  firma: string;
  ulke: string | null;
  sorumlu: string | null;
  potansiyel: string;
  takip: keyof typeof TAKIP;
  kanal: keyof typeof KANAL;
  talep: string | null;
  kisi: string | null;
  etkinlik: string | null;
  gun: number | null;
  gorev: number;
};

const SIRA: (keyof typeof TAKIP)[] = [
  "yeni",
  "gorusuldu",
  "eposta_gonderildi",
  "teknik_bilgi_istendi",
  "cizim_bekleniyor",
  "teklif_verilecek",
  "teklif_gonderildi",
  "olumsuz",
];

/**
 * Kanban: sütunlar aşama, kartlar görüşme. Sürükle-bırak (fare) ya da kartın
 * altındaki seçim (dokunmatik ekran, klavye) aynı eylemi çağırır. Değişiklik
 * önce ekranda yapılır; sunucu reddederse kart eski yerine döner.
 */
export function HuniPanosu({ kartlar, olumsuz, yazabilir }: { kartlar: HuniKarti[]; olumsuz: boolean; yazabilir: boolean }) {
  const [yerel, setYerel] = useState(kartlar);
  const [surulen, setSurulen] = useState<number | null>(null);
  const [ustunde, setUstunde] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [, baslat] = useTransition();
  const [onceki, setOnceki] = useState(kartlar);
  /* Sunucudan yeni liste gelince (süzgeç değişti) yerel kopyayı yenile. */
  if (onceki !== kartlar) {
    setOnceki(kartlar);
    setYerel(kartlar);
  }

  const tasi = (id: number, takip: keyof typeof TAKIP) => {
    const kart = yerel.find((k) => k.id === id);
    if (!kart || kart.takip === takip || !yazabilir) return;
    const eski = kart.takip;
    setHata(null);
    setYerel((l) => l.map((k) => (k.id === id ? { ...k, takip, gun: 0 } : k)));
    baslat(async () => {
      try {
        await asamaDegistir(id, takip);
      } catch {
        setYerel((l) => l.map((k) => (k.id === id ? { ...k, takip: eski } : k)));
        setHata(`${kart.firma} taşınamadı; sayfayı yenileyip yeniden deneyin.`);
      }
    });
  };

  const sutunlar = SIRA.filter((s) => olumsuz || s !== "olumsuz");

  return (
    <div className="space-y-3">
      {hata ? <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600">{hata}</p> : null}
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        {sutunlar.map((s) => {
          const icindekiler = yerel.filter((k) => k.takip === s);
          return (
            <section
              key={s}
              onDragOver={(e) => {
                if (surulen === null) return;
                e.preventDefault();
                setUstunde(s);
              }}
              onDragLeave={() => setUstunde((u) => (u === s ? null : u))}
              onDrop={(e) => {
                e.preventDefault();
                if (surulen !== null) tasi(surulen, s);
                setSurulen(null);
                setUstunde(null);
              }}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-gray-50 transition ${
                ustunde === s ? "border-brand-300 bg-brand-25" : "border-gray-200"
              }`}
            >
              <header className="flex items-center justify-between gap-2 px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${TAKIP_RENK[s]}`}>
                  {TAKIP[s]}
                </span>
                <span className="text-theme-sm font-semibold text-gray-500 tabular-nums">{icindekiler.length}</span>
              </header>
              <ol className="flex min-h-24 flex-col gap-2.5 px-3 pb-3">
                {icindekiler.map((k) => (
                  <li
                    key={k.id}
                    draggable={yazabilir}
                    onDragStart={(e) => {
                      setSurulen(k.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setSurulen(null);
                      setUstunde(null);
                    }}
                    className={`rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs ${yazabilir ? "cursor-grab active:cursor-grabbing" : ""} ${
                      surulen === k.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/firmalar/${k.firmaId}`} className="min-w-0 text-theme-sm font-medium text-gray-800 hover:text-brand-500">
                        {k.firma}
                      </Link>
                      {k.gun !== null ? (
                        <span
                          title="Son temastan bu yana gün"
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-theme-xs font-semibold tabular-nums ${
                            k.gun > 14 && s !== "olumsuz" ? "bg-error-50 text-error-600" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {k.gun} g
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-theme-xs text-gray-500">
                      {[k.ulke, KANAL[k.kanal]].filter(Boolean).join(" · ")}
                    </div>
                    {k.talep ? <p className="mt-1.5 line-clamp-2 text-theme-xs text-gray-600">{k.talep}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-theme-xs text-gray-500">
                      {k.kisi ? (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} /> {k.kisi}
                        </span>
                      ) : null}
                      {k.etkinlik ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} /> {k.etkinlik}
                        </span>
                      ) : null}
                      {k.gorev ? (
                        <span className="inline-flex items-center gap-1 text-brand-500">
                          <ListChecks size={12} /> {k.gorev} görev
                        </span>
                      ) : null}
                      {k.sorumlu ? <span className="ms-auto text-gray-400">{k.sorumlu}</span> : null}
                    </div>
                    {yazabilir ? (
                      <select
                        value={k.takip}
                        onChange={(e) => tasi(k.id, e.target.value as keyof typeof TAKIP)}
                        className="mt-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-theme-xs text-gray-600 md:hidden"
                        aria-label={`${k.firma} aşaması`}
                      >
                        {SIRA.map((a) => (
                          <option key={a} value={a}>
                            {TAKIP[a]}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </li>
                ))}
                {icindekiler.length === 0 ? <li className="px-1 py-3 text-center text-theme-xs text-gray-400">Kart yok</li> : null}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
