"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CircleCheck, Loader2, Paperclip, Send, TriangleAlert, X } from "lucide-react";
import { boyutYaz, type Ek } from "@/lib/posta-bicim";

/**
 * E-posta yazma formu — yeni, yanıt ya da iletme. Alanlar önceden
 * doldurulmuş gelebilir (yanıtta alıcı, konu ve alıntı; iletmede orijinalin
 * ekleri, işaretli gelir).
 *
 * Gönderim `/admin/eposta/gonder`e (dosya yüklendiği için sunucu eylemi değil,
 * bkz. gonder/route.ts). Başarılı olunca form kilitlenir ve Gönderilmiş'e
 * bağlantı çıkar — aynı maili yanlışlıkla iki kez göndermek zorlaşsın.
 *
 * Alanlar KONTROLLÜ ve form elle gönderiliyor: React 19 `action` verilen formu
 * eylem bitince sıfırlıyordu ve seçim kutusunu geri yüklemiyordu — "gulsoy"dan
 * yazılan mail, hatadan sonra ekranda sessizce "ege"ye dönüyordu.
 */

/** Bu kadardan büyük eklerde uyarı: paylaşımlı sunucu yoğunken büyük mail kuyrukta bekleyebiliyor. */
const UYARI_BAYT = 2 * 1024 * 1024;
/** Sunucudaki sınırla aynı (posta-gonder.ts EK_TOPLAM_EN_COK). */
const EN_COK_BAYT = 20 * 1024 * 1024;

export type Iletilen = { kutu: string; klasor: "gelen" | "giden"; uid: number; ekler: Ek[] };

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
  iletilen,
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
  /** İletirken: orijinal ileti ve ekleri (gönderimde kutudan alınır) */
  iletilen?: Iletilen;
  kapatHref: string;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [sonuc, setSonuc] = useState<{ tamam: boolean; mesaj: string } | null>(null);
  const [bilgiAcik, setBilgiAcik] = useState(false);
  const [gonderen, setGonderen] = useState(kutu);
  const [alici, setAlici] = useState(kime);
  const [bilgi, setBilgi] = useState("");
  const [baslik2, setKonu] = useState(konu);
  const [govde, setGovde] = useState(metin);
  const [dosyalar, setDosyalar] = useState<File[]>([]);
  /* İletirken ekler işaretli gelir; iletinin içine gömülü görseller (imza
     logosu) işaretsiz — gerekirse işaretlenir. */
  const [secili, setSecili] = useState<Set<string>>(
    () => new Set((iletilen?.ekler ?? []).filter((e) => !e.satirIci).map((e) => e.parca))
  );
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
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

  const iletilenBoyut = (iletilen?.ekler ?? []).filter((e) => secili.has(e.parca)).reduce((t, e) => t + e.boyut, 0);
  const toplam = iletilenBoyut + dosyalar.reduce((t, f) => t + f.size, 0);
  const cokBuyuk = toplam > EN_COK_BAYT;

  const gonder = (form: HTMLFormElement) => {
    const veri = new FormData(form);
    veri.delete("dosya");
    for (const f of dosyalar) veri.append("dosya", f, f.name);
    basla(async () => {
      try {
        const r = await fetch("/admin/eposta/gonder", { method: "POST", body: veri });
        const j = (await r.json().catch(() => null)) as { tamam: boolean; mesaj: string } | null;
        setSonuc(j ?? { tamam: false, mesaj: `Sunucu beklenmeyen cevap verdi (HTTP ${r.status}).` });
        if (j?.tamam) router.refresh();
      } catch {
        setSonuc({ tamam: false, mesaj: "Sunucuya ulaşılamadı — bağlantıyı kontrol edip tekrar deneyin." });
      }
    });
  };

  const giris =
    "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!cokBuyuk) gonder(e.currentTarget);
      }}
      className="flex h-full flex-col"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="font-semibold">{baslik}</h2>
        <Link href={kapatHref} className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-ink" aria-label="Kapat">
          <X className="size-4" aria-hidden />
        </Link>
      </div>

      <fieldset disabled={bekliyor || bitti} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        <input type="hidden" name="mesaj_kimligi" value={mesajKimligi} />
        <input type="hidden" name="referanslar" value={referanslar} />
        {yanitUid ? <input type="hidden" name="yanit_uid" value={yanitUid} /> : null}
        {iletilen ? (
          <>
            <input type="hidden" name="ilet_kutu" value={iletilen.kutu} />
            <input type="hidden" name="ilet_klasor" value={iletilen.klasor} />
            <input type="hidden" name="ilet_uid" value={iletilen.uid} />
          </>
        ) : null}

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
          rows={12}
          placeholder="Metin…"
          className={`${giris} min-h-56 flex-1 resize-y font-sans leading-relaxed`}
        />

        {/* ------------------------------------------------------ ekler */}
        <div className="space-y-1.5 text-sm">
          {iletilen?.ekler.length ? (
            <fieldset className="rounded-lg border border-line px-3 py-2">
              <legend className="px-1 text-xs font-semibold text-muted">İletinin ekleri</legend>
              <ul className="space-y-1">
                {iletilen.ekler.map((e) => (
                  <li key={e.parca}>
                    <label className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        name="ilet_parca"
                        value={e.parca}
                        checked={secili.has(e.parca)}
                        onChange={(x) => {
                          const s = new Set(secili);
                          if (x.target.checked) s.add(e.parca);
                          else s.delete(e.parca);
                          setSecili(s);
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate" title={e.ad}>
                        {e.ad}
                        {e.satirIci ? <span className="text-muted"> · iletideki görsel</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-muted">{boyutYaz(e.boyut)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}

          {dosyalar.length ? (
            <ul className="space-y-1">
              {dosyalar.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-line px-3 py-1.5">
                  <Paperclip className="size-3.5 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate" title={f.name}>
                    {f.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{boyutYaz(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => setDosyalar(dosyalar.filter((_, j) => j !== i))}
                    className="rounded p-0.5 text-muted hover:text-ink"
                    aria-label={`${f.name} dosyasını çıkar`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={dosyaRef}
              type="file"
              name="dosya"
              multiple
              className="hidden"
              onChange={(e) => {
                const yeni = Array.from(e.target.files ?? []);
                setDosyalar([...dosyalar, ...yeni].slice(0, 10));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => dosyaRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-alt"
            >
              <Paperclip className="size-3.5" aria-hidden /> Dosya ekle
            </button>
            {toplam ? (
              <span className={`text-xs ${cokBuyuk ? "font-semibold text-red-700" : toplam > UYARI_BAYT ? "text-amber-800" : "text-muted"}`}>
                Ekler: {boyutYaz(toplam)}
                {cokBuyuk
                  ? ` — en çok ${boyutYaz(EN_COK_BAYT)}; bir kısmını çıkarın.`
                  : toplam > UYARI_BAYT
                    ? " — büyük; sunucu yoğunken teslim gecikebilir."
                    : ""}
              </span>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
        {!bitti ? (
          <button
            disabled={bekliyor || cokBuyuk}
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
