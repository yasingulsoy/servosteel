"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CircleCheck, Loader2, Send, TriangleAlert, X } from "lucide-react";
import { epostaGonderEylemi, type YazmaSonucu } from "./actions";

/**
 * E-posta yazma formu — yeni, yanıt ya da iletme. Alanlar önceden
 * doldurulmuş gelebilir (yanıtta alıcı, konu ve alıntı).
 *
 * Gönderim sunucu eyleminde; bu bileşen yalnızca formu tutar ve sonucu
 * gösterir. Başarılı olunca form kilitlenir ve Gönderilmiş'e bağlantı çıkar —
 * aynı maili yanlışlıkla iki kez göndermek zorlaşsın.
 */
export function YazmaFormu({
  kutular,
  kutu,
  baslik,
  kime = "",
  konu = "",
  metin = "",
  mesajKimligi = "",
  referanslar = "",
  yanitUid,
  kapatHref,
}: {
  kutular: { user: string; ad: string }[];
  kutu: string;
  baslik: string;
  kime?: string;
  konu?: string;
  metin?: string;
  mesajKimligi?: string;
  referanslar?: string;
  yanitUid?: number;
  kapatHref: string;
}) {
  const [sonuc, eylem, bekliyor] = useActionState<YazmaSonucu, FormData>(epostaGonderEylemi, null);
  const [bilgiAcik, setBilgiAcik] = useState(false);
  const [gonderen, setGonderen] = useState(kutu);
  /* Alanlar KONTROLLÜ: React 19 form eylemi bitince kontrolsüz alanları
     sıfırlıyor — eylem hata döndürse bile ("geçersiz adres" gibi). Kontrolsüz
     kalsalar kullanıcı yazdığı maili kaybederdi. */
  const [alici, setAlici] = useState(kime);
  const [bilgi, setBilgi] = useState("");
  const [baslik2, setKonu] = useState(konu);
  const [govde, setGovde] = useState(metin);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const bitti = sonuc?.tamam === true;

  /* Yanıtta imleç en başta: alıntının üstüne yazılır. */
  useEffect(() => {
    const t = metinRef.current;
    if (t && metin) {
      t.focus();
      t.setSelectionRange(0, 0);
      t.scrollTop = 0;
    }
  }, [metin]);

  const giris =
    "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

  return (
    <form action={eylem} className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="font-semibold">{baslik}</h2>
        <Link href={kapatHref} className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-ink" aria-label="Kapat">
          <X className="size-4" aria-hidden />
        </Link>
      </div>

      <fieldset disabled={bekliyor || bitti} className="flex flex-1 flex-col gap-2.5 px-4 py-3">
        <input type="hidden" name="mesaj_kimligi" value={mesajKimligi} />
        <input type="hidden" name="referanslar" value={referanslar} />
        {yanitUid ? <input type="hidden" name="yanit_uid" value={yanitUid} /> : null}

        <label className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
          <span className="text-muted">Kimden</span>
          <select name="kutu" value={gonderen} onChange={(e) => setGonderen(e.target.value)} className={giris}>
            {kutular.map((k) => (
              <option key={k.user} value={k.user}>
                {k.ad} &lt;{k.user}&gt;
              </option>
            ))}
          </select>
        </label>

        <label className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
          <span className="text-muted">Kime</span>
          <span className="flex items-center gap-2">
            <input
              name="kime"
              value={alici}
              onChange={(e) => setAlici(e.target.value)}
              required
              autoComplete="off"
              placeholder="ad@firma.com — birden çoksa virgülle"
              className={giris}
            />
            {!bilgiAcik ? (
              <button
                type="button"
                onClick={() => setBilgiAcik(true)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-surface-alt hover:text-ink"
              >
                Bilgi
              </button>
            ) : null}
          </span>
        </label>

        {bilgiAcik ? (
          <label className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
            <span className="text-muted">Bilgi</span>
            <input
              name="bilgi"
              value={bilgi}
              onChange={(e) => setBilgi(e.target.value)}
              autoComplete="off"
              placeholder="Kopya alacak adresler (Cc)"
              className={giris}
            />
          </label>
        ) : null}

        <label className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
          <span className="text-muted">Konu</span>
          <input
            name="konu"
            value={baslik2}
            onChange={(e) => setKonu(e.target.value)}
            required
            maxLength={300}
            className={giris}
          />
        </label>

        <textarea
          ref={metinRef}
          name="metin"
          value={govde}
          onChange={(e) => setGovde(e.target.value)}
          required
          rows={14}
          placeholder="Metin…"
          className={`${giris} min-h-64 flex-1 resize-y font-sans leading-relaxed`}
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
        {!bitti ? (
          <button
            disabled={bekliyor}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            {bekliyor ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {bekliyor ? "Gönderiliyor…" : "Gönder"}
          </button>
        ) : null}

        {sonuc ? (
          <p
            role="status"
            className={`flex items-start gap-1.5 text-sm ${sonuc.tamam ? "text-emerald-700" : "text-red-700"}`}
          >
            {sonuc.tamam ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span>{sonuc.mesaj}</span>
          </p>
        ) : null}

        {bitti ? (
          <Link
            href={`/admin/eposta?kutu=${encodeURIComponent(gonderen)}&klasor=giden`}
            className="ml-auto text-sm font-semibold underline underline-offset-4"
          >
            Gönderilmiş&apos;e git
          </Link>
        ) : (
          <span className="ml-auto text-xs text-muted">Kopyası gönderen kutunun Gönderilmiş klasörüne konur.</span>
        )}
      </div>
    </form>
  );
}
