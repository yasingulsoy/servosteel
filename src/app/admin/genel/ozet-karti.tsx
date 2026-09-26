"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { CircleCheck, Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { ozetAyarEylemi, ozetSimdiGonderEylemi, type OzetSonucu } from "./actions";

/**
 * Genel bakıştaki "Haftalık özet e-postası" kartı: açık/kapalı, alıcılar,
 * önizleme, şimdi gönder. Ayarı ve gönderimi yalnızca yönetici değiştirir;
 * diğerleri durumu görür.
 */
export function OzetKarti({
  admin,
  acik,
  alicilar,
  son,
  eksik,
  gscBagli,
}: {
  admin: boolean;
  acik: boolean;
  alicilar: string;
  /** Son otomatik gönderim: tarih + sonuç metni */
  son: { tarih: string; yazi: string; tamam: boolean } | null;
  /** SMTP ayarı eksikse sebebi */
  eksik: string | null;
  gscBagli: boolean;
}) {
  const [kayit, kaydet, kaydediyor] = useActionState<OzetSonucu, FormData>(ozetAyarEylemi, null);
  const [gonderim, gonder, gonderiyor] = useActionState<OzetSonucu>(ozetSimdiGonderEylemi, null);
  /* Kontrollü alanlar + `onSubmit`: React 19 `action` verilen formu eylem
     bitince sıfırlıyor (hata dönse bile) ve onay kutusunu durumdan geri
     yüklemiyor — "Açık" ekranda boşalıyor, sonraki kayıtta özet sessizce
     kapanıyordu. Elle gönderince sıfırlama olmuyor. */
  const [liste, setListe] = useState(alicilar);
  const [acikMi, setAcik] = useState(acik);

  const durum = (s: OzetSonucu) =>
    s ? (
      <p role="status" className={`flex items-start gap-1.5 text-sm ${s.tamam ? "text-emerald-700" : "text-red-700"}`}>
        {s.tamam ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span>{s.mesaj}</span>
      </p>
    ) : null;

  return (
    <section className="min-w-0 rounded-xl border border-line bg-card px-4 py-3" aria-label="Haftalık özet e-postası">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <MailCheck className="size-3.5" aria-hidden /> Haftalık özet e-postası
        </h2>
        <Link href="/admin/genel/ozet" className="text-xs font-semibold underline underline-offset-4">
          Önizle
        </Link>
      </div>

      <p className="mt-2 text-sm">
        {acik ? (
          <>
            <strong>Açık</strong> — her pazartesi 08:30, geçen haftanın sayıları
            {alicilar ? <span className="text-muted"> · {alicilar}</span> : null}
          </>
        ) : (
          <>
            <strong>Kapalı</strong>
            <span className="text-muted"> — açılınca her pazartesi 08:30&apos;da geçen haftanın talep, e-posta ve Google sayıları gider.</span>
          </>
        )}
      </p>
      {son ? (
        <p className={`mt-1 text-xs ${son.tamam ? "text-muted" : "text-red-700"}`}>
          Son otomatik gönderim {son.tarih}: {son.yazi}
        </p>
      ) : null}
      {eksik ? <p className="mt-1 text-xs text-red-700">Gönderim için eksik ayar: {eksik}</p> : null}
      {!gscBagli ? (
        <p className="mt-1 text-xs text-muted">
          Google araması satırları için sunucuda Search Console bağlantısı (GSC_HIZMET_HESABI) yok — özet onlarsız gider.
        </p>
      ) : null}

      {admin ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const veri = new FormData(e.currentTarget);
              startTransition(() => kaydet(veri));
            }}
            className="mt-3 space-y-2"
          >
            <label className="block text-sm">
              <span className="text-muted">Alıcılar (virgülle, en çok 10)</span>
              <input
                name="alicilar"
                value={liste}
                onChange={(e) => setListe(e.target.value)}
                placeholder="ad@servosteel.com.tr, patron@…"
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="acik" checked={acikMi} onChange={(e) => setAcik(e.target.checked)} /> Açık
              </label>
              <button
                disabled={kaydediyor}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-zinc-950 disabled:opacity-60"
              >
                {kaydediyor ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Kaydet
              </button>
            </div>
            {durum(kayit)}
          </form>

          <form
            action={gonder}
            onSubmit={(e) => {
              if (!window.confirm("Geçen haftanın özeti şimdi kayıtlı alıcılara gönderilsin mi?")) e.preventDefault();
            }}
            className="mt-3 border-t border-line pt-3"
          >
            <button
              disabled={gonderiyor}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-surface-alt disabled:opacity-60"
            >
              {gonderiyor ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Şimdi gönder
            </button>
            <span className="ml-2 text-xs text-muted">Geçen haftanın özeti, kayıtlı alıcılara — denemek için.</span>
            <div className="mt-2">{durum(gonderim)}</div>
          </form>
        </>
      ) : null}
    </section>
  );
}
