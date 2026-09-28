"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CircleCheck, FilePen, Loader2, Paperclip, Send, TriangleAlert, X } from "lucide-react";
import { boyutYaz, type Ek } from "@/lib/posta-bicim";

/**
 * E-posta yazma formu — yeni, yanıt, tümünü yanıtla, iletme ya da taslak.
 * Alanlar önceden doldurulmuş gelebilir (yanıtta alıcı, konu ve alıntı;
 * iletmede orijinalin ekleri, işaretli gelir).
 *
 * Gönderim `/admin/eposta/gonder`e (dosya yüklendiği için sunucu eylemi değil,
 * bkz. gonder/route.ts). Başarılı olunca form kilitlenir ve Gönderilmiş'e
 * bağlantı çıkar — aynı maili yanlışlıkla iki kez göndermek zorlaşsın.
 *
 * Taslak (Outlook gibi): "Taslak kaydet" kutunun Taslaklar klasörüne koyar,
 * yeniden kaydedince eski sürüm silinir. Ekler taslağın İÇİNE girer — sonraki
 * kaydetme ve gönderim ekleri taslaktan alır. Taslaktan gönderilince taslak
 * silinir.
 *
 * Alanlar KONTROLLÜ ve form elle gönderiliyor: React 19 `action` verilen formu
 * eylem bitince sıfırlıyordu ve seçim kutusunu geri yüklemiyordu — "gulsoy"dan
 * yazılan mail, hatadan sonra ekranda sessizce "ege"ye dönüyordu.
 */

/** Bu kadardan büyük eklerde uyarı: paylaşımlı sunucu yoğunken büyük mail kuyrukta bekleyebiliyor. */
const UYARI_BAYT = 2 * 1024 * 1024;
/** Sunucudaki sınırla aynı (posta-gonder.ts EK_TOPLAM_EN_COK). */
const EN_COK_BAYT = 20 * 1024 * 1024;

export type Iletilen = { kutu: string; klasor: string; uid: number; ekler: Ek[] };
type TaslakYeri = { kutu: string; uid: number };
type Cevap = { tamam: boolean; mesaj: string; uyari?: boolean; taslak?: (TaslakYeri & { ekler: Ek[] }) | null };

export function YazmaFormu({
  kutular,
  kutu,
  baslik,
  kime = "",
  bilgi: ilkBilgi = "",
  gizli: ilkGizli = "",
  konu = "",
  metin = "",
  mesajKimligi = "",
  referanslar = "",
  yanitUid,
  yanitKlasor,
  yanitKutu,
  iletilen,
  talepId,
  taslak: acilanTaslak,
  kapatHref,
}: {
  kutular: { user: string; ad: string }[];
  kutu: string;
  baslik: string;
  kime?: string;
  bilgi?: string;
  gizli?: string;
  konu?: string;
  metin?: string;
  mesajKimligi?: string;
  referanslar?: string;
  /** Yanıtlanan ileti — gönderilince kendi kutusunda "yanıtlandı" işaretlenir */
  yanitUid?: number;
  yanitKlasor?: string;
  yanitKutu?: string;
  /** İletirken: orijinal ileti ve ekleri (gönderimde kutudan alınır). Taslakta: taslağın ekleri */
  iletilen?: Iletilen;
  /** Talep iletirken: gönderilince talebe "iletildi" notu düşer */
  talepId?: number;
  /** Taslaklar'dan açıldıysa: taslağın yeri */
  taslak?: TaslakYeri;
  kapatHref: string;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [islem, setIslem] = useState<"gonder" | "taslak">("gonder");
  const [sonuc, setSonuc] = useState<{ tamam: boolean; mesaj: string; taslak?: boolean } | null>(null);
  const [bilgiAcik, setBilgiAcik] = useState(Boolean(ilkBilgi));
  const [gizliAcik, setGizliAcik] = useState(Boolean(ilkGizli));
  const [gonderen, setGonderen] = useState(kutu);
  const [alici, setAlici] = useState(kime);
  const [bilgi, setBilgi] = useState(ilkBilgi);
  const [gizli, setGizli] = useState(ilkGizli);
  const [baslik2, setKonu] = useState(konu);
  const [govde, setGovde] = useState(metin);
  const [dosyalar, setDosyalar] = useState<File[]>([]);
  const [ekKaynagi, setEkKaynagi] = useState<Iletilen | undefined>(iletilen);
  const [taslak, setTaslak] = useState<TaslakYeri | null>(acilanTaslak ?? null);
  /* İletirken ekler işaretli gelir; iletinin içine gömülü görseller (imza
     logosu) işaretsiz — gerekirse işaretlenir. Taslağın ekleri hep işaretli. */
  const [secili, setSecili] = useState<Set<string>>(
    () => new Set((iletilen?.ekler ?? []).filter((e) => acilanTaslak || !e.satirIci).map((e) => e.parca))
  );
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const bitti = sonuc?.tamam === true && !sonuc.taslak;
  const taslakEkleri = ekKaynagi?.klasor === "taslak";

  /* Yanıtta imleç en başta: alıntının üstüne yazılır. Yalnızca ilk açılışta —
     taslak kaydedilince sayfa yeni taslağa geçer, imleç yerinden oynamasın. */
  useEffect(() => {
    const t = metinRef.current;
    if (t && t.value) {
      t.focus();
      t.setSelectionRange(0, 0);
      t.scrollTop = 0;
    }
  }, []);

  const iletilenBoyut = (ekKaynagi?.ekler ?? []).filter((e) => secili.has(e.parca)).reduce((t, e) => t + e.boyut, 0);
  const toplam = iletilenBoyut + dosyalar.reduce((t, f) => t + f.size, 0);
  const cokBuyuk = toplam > EN_COK_BAYT;

  const gonder = (form: HTMLFormElement, ne: "gonder" | "taslak") => {
    const veri = new FormData(form);
    veri.delete("dosya");
    for (const f of dosyalar) veri.append("dosya", f, f.name);
    if (ne === "taslak") veri.set("islem", "taslak");
    setIslem(ne);
    basla(async () => {
      try {
        const r = await fetch("/admin/eposta/gonder", { method: "POST", body: veri });
        const j = (await r.json().catch(() => null)) as Cevap | null;
        if (!j) {
          setSonuc({ tamam: false, mesaj: `Sunucu beklenmeyen cevap verdi (HTTP ${r.status}).` });
          return;
        }
        if (ne === "gonder") {
          setSonuc({ tamam: j.tamam, mesaj: j.mesaj });
          if (!j.tamam) return;
          if (!acilanTaslak) {
            router.refresh();
          } else if (!j.uyari) {
            /* Taslaktan gönderildi: taslak artık yok, adres onu gösteriyor —
               Taslaklar'a dönülür, sağda "gönderildi" yazar. Kopya
               Gönderilmiş'e konamadıysa uyarı okunsun diye form yerinde kalır. */
            router.replace(`/admin/eposta?${new URLSearchParams({ kutu: taslak?.kutu ?? gonderen, klasor: "taslak", gonderildi: gonderen })}`);
          }
          return;
        }
        setSonuc({ tamam: j.tamam, mesaj: j.mesaj, taslak: true });
        if (!j.tamam) return;
        const yeni = j.taslak ?? null;
        setTaslak(yeni ? { kutu: yeni.kutu, uid: yeni.uid } : null);
        if (yeni) {
          /* Yüklenen dosyalar ve seçilen ekler artık taslağın içinde */
          setEkKaynagi(yeni.ekler.length ? { kutu: yeni.kutu, klasor: "taslak", uid: yeni.uid, ekler: yeni.ekler } : undefined);
          setSecili(new Set(yeni.ekler.map((e) => e.parca)));
          setDosyalar([]);
        }
        /* Taslaklar'dan açılan taslağın adresi eski UID'yi taşıyor — yenisine geç
           (form aynı kalır, bkz. page.tsx key). Ötekilerde yalnızca sayılar tazelenir. */
        if (acilanTaslak && yeni) {
          router.replace(`/admin/eposta?${new URLSearchParams({ kutu: yeni.kutu, klasor: "taslak", uid: String(yeni.uid), yaz: "taslak" })}`);
        } else {
          router.refresh();
        }
      } catch {
        setSonuc({ tamam: false, mesaj: "Sunucuya ulaşılamadı — bağlantıyı kontrol edip tekrar deneyin." });
      }
    });
  };

  const giris =
    "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60";
  const acDugmesi = "shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-surface-alt hover:text-ink";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!cokBuyuk) gonder(e.currentTarget, "gonder");
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
        {yanitUid ? (
          <>
            <input type="hidden" name="yanit_uid" value={yanitUid} />
            <input type="hidden" name="yanit_klasor" value={yanitKlasor ?? "gelen"} />
            <input type="hidden" name="yanit_kutu" value={yanitKutu ?? kutu} />
          </>
        ) : null}
        {talepId ? <input type="hidden" name="talep_id" value={talepId} /> : null}
        {taslak ? (
          <>
            <input type="hidden" name="taslak_kutu" value={taslak.kutu} />
            <input type="hidden" name="taslak_uid" value={taslak.uid} />
          </>
        ) : null}
        {ekKaynagi ? (
          <>
            <input type="hidden" name="ilet_kutu" value={ekKaynagi.kutu} />
            <input type="hidden" name="ilet_klasor" value={ekKaynagi.klasor} />
            <input type="hidden" name="ilet_uid" value={ekKaynagi.uid} />
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
          <span className="flex items-center gap-1">
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
              <button type="button" onClick={() => setBilgiAcik(true)} className={acDugmesi} title="Kopya alacak adresler (Cc)">
                Bilgi
              </button>
            ) : null}
            {!gizliAcik ? (
              <button type="button" onClick={() => setGizliAcik(true)} className={acDugmesi} title="Gizli kopya (Bcc) — öteki alıcılar görmez">
                Gizli
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

        {gizliAcik ? (
          <label className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
            <span className="text-muted">Gizli</span>
            <input
              name="gizli"
              value={gizli}
              onChange={(e) => setGizli(e.target.value)}
              autoComplete="off"
              placeholder="Gizli kopya (Bcc) — öteki alıcılar görmez"
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
          {ekKaynagi?.ekler.length ? (
            <fieldset className="rounded-lg border border-line px-3 py-2">
              <legend className="px-1 text-xs font-semibold text-muted">{taslakEkleri ? "Taslağın ekleri" : "İletinin ekleri"}</legend>
              <ul className="space-y-1">
                {ekKaynagi.ekler.map((e) => (
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
                        {e.satirIci && !taslakEkleri ? <span className="text-muted"> · iletideki görsel</span> : null}
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
          <>
            <button
              disabled={bekliyor || cokBuyuk}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              {bekliyor && islem === "gonder" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
              {bekliyor && islem === "gonder" ? "Gönderiliyor…" : "Gönder"}
            </button>
            {/* Talep iletme tek seferlik: taslaktan gönderilirse talebe "iletildi" notu düşmezdi */}
            {!talepId ? (
              <button
                type="button"
                disabled={bekliyor || cokBuyuk}
                onClick={(e) => e.currentTarget.form && gonder(e.currentTarget.form, "taslak")}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface-alt disabled:opacity-60"
              >
                {bekliyor && islem === "taslak" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FilePen className="size-4" aria-hidden />}
                {bekliyor && islem === "taslak" ? "Kaydediliyor…" : "Taslak kaydet"}
              </button>
            ) : null}
          </>
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
          <span className="ml-auto flex flex-wrap items-center gap-3">
            {talepId ? (
              <Link href={`/admin/talep/${talepId}`} className="text-sm font-semibold underline underline-offset-4">
                Talebe dön
              </Link>
            ) : null}
            <Link
              href={`/admin/eposta?kutu=${encodeURIComponent(gonderen)}&klasor=giden`}
              className="text-sm font-semibold underline underline-offset-4"
            >
              Gönderilmiş&apos;e git
            </Link>
          </span>
        ) : !sonuc ? (
          <span className="ml-auto text-xs text-muted">Kopyası gönderen kutunun Gönderilmiş klasörüne konur.</span>
        ) : null}
      </div>
    </form>
  );
}
