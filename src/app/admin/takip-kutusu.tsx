"use client";

import { useState, useTransition } from "react";
import { AlarmClock, Loader2 } from "lucide-react";
import { takipGeldi, takipGoreli, takipTarihi, type TakipTuru } from "@/lib/takip-bicim";
import { takipEylemi } from "./takip-actions";

/**
 * "Takip" kutusu — talep ve hedef firma sayfasının yan sütununda.
 *
 * Tek tıkla yarın / 3 gün / 1 hafta / 2 hafta / 1 ay; ya da takvimden gün.
 * Not isteğe bağlı ("teklifi sor", "fuarda görüş"). Gün sunucuda İstanbul'a
 * göre hesaplanır; `bugun` da sunucudan gelir — tarayıcının saati karışmaz.
 */

const HIZLI: [number, string][] = [
  [1, "Yarın"],
  [3, "3 gün"],
  [7, "1 hafta"],
  [14, "2 hafta"],
  [30, "1 ay"],
];

export function TakipKutusu({
  tur,
  id,
  tarih,
  notu,
  bugun,
}: {
  tur: TakipTuru;
  id: number;
  tarih: string | null;
  notu: string;
  bugun: string;
}) {
  const [bekliyor, basla] = useTransition();
  const [not2, setNot] = useState(notu);
  const [gun, setGun] = useState(tarih ?? "");
  const [sonuc, setSonuc] = useState<{ tamam: boolean; mesaj: string } | null>(null);

  const koy = (secim: { gun: number } | { tarih: string } | null) =>
    basla(async () => {
      const r = await takipEylemi(tur, id, secim, secim === null ? "" : not2);
      setSonuc(r);
      if (r.tamam && secim === null) setNot("");
    });

  const geldi = tarih ? takipGeldi(tarih, bugun) : false;
  const dugme =
    "rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-alt disabled:opacity-50";

  return (
    <section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-label="Takip">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <AlarmClock className="size-3.5" aria-hidden /> Takip
        {bekliyor ? <Loader2 className="size-3.5 animate-spin" aria-label="kaydediliyor" /> : null}
      </h2>

      {tarih ? (
        <p className={`mt-2 text-sm ${geldi ? "font-semibold text-red-700" : ""}`}>
          {takipTarihi(tarih)} — {takipGoreli(tarih, bugun)}
          {notu ? <span className="mt-0.5 block font-normal text-muted">{notu}</span> : null}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">Takip tarihi yok. Ne zaman tekrar yazılacak / aranacak?</p>
      )}

      <input
        value={not2}
        onChange={(e) => setNot(e.target.value)}
        maxLength={300}
        placeholder="Not — ör. teklifi sor, numune bilgisini iste"
        aria-label="Takip notu"
        className="mt-3 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {HIZLI.map(([g, ad]) => (
          <button key={g} type="button" disabled={bekliyor} onClick={() => koy({ gun: g })} className={dugme}>
            {ad}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={gun}
          onChange={(e) => setGun(e.target.value)}
          aria-label="Takip günü"
          className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={bekliyor || !gun}
          onClick={() => koy({ tarih: gun })}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          Koy
        </button>
        {tarih ? (
          <button
            type="button"
            disabled={bekliyor}
            onClick={() => koy(null)}
            className="ml-auto text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Kaldır
          </button>
        ) : null}
      </div>

      {sonuc && !sonuc.tamam ? (
        <p role="status" className="mt-2 text-sm text-red-700">
          {sonuc.mesaj}
        </p>
      ) : null}
    </section>
  );
}
