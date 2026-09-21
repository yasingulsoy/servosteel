"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ArrowRight, CircleCheck, Send, TriangleAlert } from "lucide-react";
import { gonderEylemi, type GonderSonucu } from "./actions";

/**
 * E-posta önizleme + gönderim.
 *
 * Gönderim İKİ ADIMLI: "Gönder…" onay kutusunu açar, asıl gönderen ikinci
 * düğme — geri alınamayan, dışarıya giden bir iş tek yanlış tıklamayla
 * olmasın. Konu ve metin düzenlenebilir; altbilgi (abonelikten çıkma,
 * unvan, adres) düzenlenemez, sunucu her gönderimde kendisi ekler.
 *
 * Düğmeyi kapatan sebepler (tavan, aralık, sigorta, ülke…) sunucuda da
 * AYRICA kontrol ediliyor; buradaki yalnızca kullanıcıya boşuna tıklatmamak için.
 */
export function GonderKutusu({
  id,
  gonderen,
  alici,
  konu,
  govde,
  altbilgi,
  engel,
  bekleSn,
  uyari,
  grup,
  ulke,
  segment,
}: {
  id: number;
  gonderen: string;
  alici: string;
  konu: string;
  govde: string;
  altbilgi: string;
  engel: string | null;
  bekleSn: number;
  uyari: string | null;
  grup?: string;
  ulke?: string;
  segment?: string;
}) {
  const [sonuc, eylem, bekliyor] = useActionState<GonderSonucu, FormData>(gonderEylemi, null);
  const [onay, setOnay] = useState(false);
  const [kalan, setKalan] = useState(bekleSn);
  /* Kontrollü alanlar: React 19 eylemden sonra formu sıfırlıyor; gönderim
     reddedilirse (ör. aralık dolmadı) elle yapılan düzeltme kaybolmasın. */
  const [konuYazi, setKonuYazi] = useState(konu);
  const [govdeYazi, setGovdeYazi] = useState(govde);
  const degisti = konuYazi !== konu || govdeYazi !== govde;

  /* Yeni sonuç gelince onay kapanır; sunucu "şu kadar bekle" dediyse sayaç
     ondan başlar. Efekt değil, çizim sırasında: React'in "önceki değeri
     sakla" kalıbı — efektte setState fazladan bir çizim turu doğurur. */
  const [gorulenSonuc, setGorulenSonuc] = useState<GonderSonucu>(null);
  if (sonuc !== gorulenSonuc) {
    setGorulenSonuc(sonuc);
    setOnay(false);
    if (sonuc?.bekle) setKalan(sonuc.bekle);
  }

  useEffect(() => {
    if (kalan <= 0) return;
    const t = setTimeout(() => setKalan((k) => k - 1), 1000);
    return () => clearTimeout(t);
  }, [kalan]);

  const gitti = sonuc?.tamam === true;
  const kapali = !!engel || gitti;
  const sorgu = new URLSearchParams(
    Object.entries({ grup, ulke, segment }).filter((x): x is [string, string] => !!x[1])
  ).toString();
  const alan =
    "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus-visible:border-accent disabled:bg-surface-alt disabled:text-muted sm:text-sm";

  return (
    <form action={eylem} className="rounded-xl border border-line bg-card p-4 sm:p-5">
      <input type="hidden" name="id" value={id} />
      {grup ? <input type="hidden" name="grup" value={grup} /> : null}
      {ulke ? <input type="hidden" name="ulke" value={ulke} /> : null}
      {segment ? <input type="hidden" name="segment" value={segment} /> : null}

      <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Gönderen</dt>
        <dd className="break-all font-medium">{gonderen}</dd>
        <dt className="text-muted">Alıcı</dt>
        <dd className="break-all font-medium">{alici || "—"}</dd>
      </dl>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Konu</span>
        <input
          name="konu"
          value={konuYazi}
          onChange={(e) => setKonuYazi(e.target.value)}
          maxLength={300}
          disabled={kapali}
          className={`mt-1.5 ${alan}`}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Metin</span>
        <textarea
          name="govde"
          value={govdeYazi}
          onChange={(e) => setGovdeYazi(e.target.value)}
          rows={16}
          disabled={kapali}
          className={`mt-1.5 leading-relaxed ${alan}`}
        />
      </label>
      {degisti && !kapali ? (
        <button
          type="button"
          onClick={() => {
            setKonuYazi(konu);
            setGovdeYazi(govde);
          }}
          className="mt-1 text-xs font-medium text-muted underline-offset-4 hover:underline"
        >
          Hazır metne dön
        </button>
      ) : null}

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Altbilgi — her e-postaya otomatik eklenir
      </p>
      <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-lg bg-surface-alt px-3 py-2.5 font-sans text-xs leading-relaxed text-muted">
        {altbilgi.replace(/^\n+/, "")}
      </pre>

      {uyari && !kapali ? (
        <p className="mt-4 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {uyari}
        </p>
      ) : null}

      {engel && !gitti ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-alt px-3 py-2.5 text-sm">{engel}</p>
      ) : null}

      {sonuc ? (
        <p
          role="status"
          className={`mt-4 flex gap-2 rounded-lg px-3 py-2.5 text-sm ${
            sonuc.tamam
              ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {sonuc.tamam ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {sonuc.mesaj}
        </p>
      ) : null}

      {gitti ? (
        sonuc?.sonraki ? (
          <Link
            href={`/admin/firmalar/${sonuc.sonraki}${sorgu ? `?${sorgu}` : ""}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Sıradaki firma
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <p className="mt-4 text-sm text-muted">Bu süzgeçte gönderilecek başka firma kalmadı.</p>
        )
      ) : !engel ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Anahtarlar ŞART: onlarsız React aynı <button> öğesini yerinde
              type="button" → "submit" yapıyor ve tarayıcı, tıklamanın
              varsayılan eylemini değişmiş türe göre uyguluyordu — "Gönder…"e
              TEK tık e-postayı onaysız gönderdi (sahte SMTP'de yakalandı).
              Farklı anahtar = yeni öğe; ayrıca ilk düğmede preventDefault. */}
          {onay ? (
            <>
              <button
                key="gonder"
                type="submit"
                disabled={bekliyor || kalan > 0}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden />
                {bekliyor ? "Gönderiliyor…" : `Evet, ${alici} adresine gönder`}
              </button>
              <button
                key="vazgec"
                type="button"
                disabled={bekliyor}
                onClick={(e) => {
                  e.preventDefault();
                  setOnay(false);
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted"
              >
                Vazgeç
              </button>
            </>
          ) : (
            <button
              key="onay-ac"
              type="button"
              disabled={kalan > 0}
              onClick={(e) => {
                e.preventDefault();
                setOnay(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-shell px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Send className="size-4" aria-hidden />
              {kalan > 0 ? `${kalan} sn sonra gönderilebilir` : "Gönder…"}
            </button>
          )}
        </div>
      ) : null}
    </form>
  );
}
