"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Archive,
  Flag,
  FlagOff,
  FolderInput,
  Loader2,
  Mail,
  MailOpen,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";

/**
 * Okuyucunun araç çubuğu — Outlook'taki gibi: okundu/okunmadı, bayrak, arşivle,
 * önemsiz, sil (Silinmiş'e taşır; oradaysa "Geri al" Gelen'e döndürür), taşı.
 * `/admin/eposta/islem`e JSON gönderir. Taşıyan işlemden sonra ileti bu
 * klasörde olmadığı için listeye dönülür; "okunmadı yap"ta da (açık kalsa
 * yeniden okundu sayılırdı); öteki işaretlerde sayfa tazelenir.
 */

type HedefKlasor = { anahtar: string; ad: string; derinlik: number };

export function IletiIslemleri({
  kutu,
  klasor,
  tur,
  uid,
  okundu,
  bayrakli,
  klasorler,
  listeHref,
}: {
  kutu: string;
  klasor: string;
  /** Açık klasörün türü (gelen, giden, taslak, arsiv, onemsiz, cop) ya da null */
  tur: string | null;
  uid: number;
  okundu: boolean;
  bayrakli: boolean;
  klasorler: HedefKlasor[];
  listeHref: string;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [sonuc, setSonuc] = useState<{ tamam: boolean; mesaj: string } | null>(null);

  const yap = (islem: string, hedef?: string) =>
    basla(async () => {
      try {
        const r = await fetch("/admin/eposta/islem", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kutu, klasor, uidler: [uid], islem, hedef }),
        });
        const j = (await r.json().catch(() => null)) as { tamam: boolean; mesaj: string; tasindi?: boolean } | null;
        if (!j) {
          setSonuc({ tamam: false, mesaj: `Sunucu beklenmeyen cevap verdi (HTTP ${r.status}).` });
          return;
        }
        setSonuc(j);
        if (j.tamam) {
          /* "Okunmadı yap"ta da listeye dönülür: ileti açık kalsaydı sayfanın
             kendiliğinden tazelenmesi onu yeniden okundu yapardı. */
          if (j.tasindi || islem === "okunmadi") router.push(listeHref);
          else router.refresh();
        }
      } catch {
        setSonuc({ tamam: false, mesaj: "Sunucuya ulaşılamadı — bağlantıyı kontrol edin." });
      }
    });

  const dugme =
    "inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm hover:bg-surface-alt disabled:opacity-50";
  const tasinabilir = klasorler.filter((k) => k.anahtar !== klasor);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" disabled={bekliyor} onClick={() => yap(okundu ? "okunmadi" : "okundu")} className={dugme}>
        {okundu ? <Mail className="size-4" aria-hidden /> : <MailOpen className="size-4" aria-hidden />}
        {okundu ? "Okunmadı yap" : "Okundu yap"}
      </button>
      <button type="button" disabled={bekliyor} onClick={() => yap(bayrakli ? "bayrak-kaldir" : "bayrak")} className={dugme}>
        {bayrakli ? <FlagOff className="size-4" aria-hidden /> : <Flag className="size-4" aria-hidden />}
        {bayrakli ? "Bayrağı kaldır" : "Bayrakla"}
      </button>
      {tur !== "arsiv" && tur !== "cop" && tur !== "taslak" ? (
        <button type="button" disabled={bekliyor} onClick={() => yap("arsivle")} className={dugme}>
          <Archive className="size-4" aria-hidden /> Arşivle
        </button>
      ) : null}
      {tur === "onemsiz" ? (
        <button type="button" disabled={bekliyor} onClick={() => yap("onemsiz-degil")} className={dugme}>
          <ShieldCheck className="size-4" aria-hidden /> Önemsiz değil
        </button>
      ) : tur !== "giden" && tur !== "taslak" && tur !== "cop" ? (
        <button type="button" disabled={bekliyor} onClick={() => yap("onemsiz")} className={dugme}>
          <ShieldAlert className="size-4" aria-hidden /> Önemsiz
        </button>
      ) : null}
      {tur === "cop" ? (
        <button type="button" disabled={bekliyor} onClick={() => yap("geri-al")} className={dugme}>
          <Undo2 className="size-4" aria-hidden /> Geri al
        </button>
      ) : (
        <button
          type="button"
          disabled={bekliyor}
          onClick={() => yap("sil")}
          className={`${dugme} text-red-700`}
          title="Silinmiş klasörüne taşır — oradan geri alınabilir"
        >
          <Trash2 className="size-4" aria-hidden /> Sil
        </button>
      )}
      {tasinabilir.length ? (
        <label className={`${dugme} cursor-pointer`}>
          <FolderInput className="size-4" aria-hidden />
          <span className="sr-only">Klasöre taşı</span>
          <select
            value=""
            disabled={bekliyor}
            onChange={(e) => e.target.value && yap("tasi", e.target.value)}
            className="max-w-36 cursor-pointer bg-transparent text-sm outline-none"
            aria-label="Klasöre taşı"
          >
            <option value="">Taşı…</option>
            {tasinabilir.map((k) => (
              <option key={k.anahtar} value={k.anahtar}>
                {"  ".repeat(k.derinlik)}
                {k.ad}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {bekliyor ? <Loader2 className="size-4 animate-spin text-muted" aria-label="işleniyor" /> : null}
      {sonuc && !bekliyor ? (
        <span role="status" className={`text-xs ${sonuc.tamam ? "text-emerald-700" : "text-red-700"}`}>
          {sonuc.mesaj}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Açık listeyi dakikada bir tazeler — yeni gelen ileti kendiliğinden görünsün
 * (Outlook gibi). Sekme arkadaysa tazelemez; yazma formu açıkken konmaz.
 */
export function Yenileyici({ saniye = 60 }: { saniye?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, saniye * 1000);
    return () => clearInterval(t);
  }, [router, saniye]);
  return null;
}
