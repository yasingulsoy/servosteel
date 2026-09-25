"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { gelenIletiEylemi } from "../actions";
import type { OkunanIleti } from "@/lib/gelen-oku";

/**
 * Gelen kutusundaki bir satır — tıklayınca ileti AÇILIR ve tam metni okunur.
 *
 * Gövde veritabanında durmadığı için (yalnızca 500 karakterlik özet var)
 * açılışta sunucu eylemiyle kutudan çekiliyor. İlk açılışta bir kez okunur,
 * sonra bellekte kalır — aynı maile iki kez bakmak kutuya iki kez gitmez.
 *
 * Metin DÜZ basılıyor: gelen posta güvenilmeyen içerik, HTML'ini işlemeye
 * gerek yok (bkz. gelen-oku.ts). Uzun yanıtlar alıntı zinciri taşıdığı için
 * kutu kaydırılabilir yükseklikte.
 */
export function GelenIleti({
  kutu,
  uidvalidity,
  uid,
  ozet,
  firmaId,
}: {
  kutu: string;
  uidvalidity: number;
  uid: number;
  ozet: string;
  firmaId: number | null;
}) {
  const [durum, setDurum] = useState<"kapali" | "yukleniyor" | "acik">("kapali");
  const [ileti, setIleti] = useState<OkunanIleti | null>(null);
  const [hata, setHata] = useState("");

  async function ac() {
    if (durum === "acik") {
      setDurum("kapali");
      return;
    }
    if (ileti) {
      setDurum("acik");
      return;
    }
    setDurum("yukleniyor");
    setHata("");
    const r = await gelenIletiEylemi(kutu, uidvalidity, uid);
    if (r.tamam) {
      setIleti(r.ileti);
      setDurum("acik");
    } else {
      setHata(r.hata);
      setDurum("kapali");
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={ac}
        aria-expanded={durum === "acik"}
        className="inline-flex items-center gap-1 text-xs font-semibold text-accent underline-offset-4 hover:underline"
      >
        {durum === "yukleniyor" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ChevronRight
            className={`size-3.5 transition-transform ${durum === "acik" ? "rotate-90" : ""}`}
            aria-hidden
          />
        )}
        {durum === "acik" ? "Kapat" : durum === "yukleniyor" ? "Kutudan okunuyor…" : "Mailin tamamını aç"}
      </button>

      {hata ? <p className="mt-1 text-xs text-red-700">{hata}</p> : null}

      {durum === "acik" && ileti ? (
        <div className="mt-2 rounded-lg border border-line bg-white">
          <div className="border-b border-line px-3 py-2 text-xs text-muted">
            <div className="font-semibold text-ink">{ileti.konu || "(konusuz)"}</div>
            <div className="mt-0.5 break-words">
              {ileti.kimden} → {ileti.kime}
              {ileti.tarih ? ` · ${new Date(ileti.tarih).toLocaleString("tr-TR")}` : ""}
            </div>
            {ileti.ekler.length ? <div className="mt-0.5">Ek: {ileti.ekler.join(", ")}</div> : null}
          </div>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-sans text-sm text-zinc-800">
            {ileti.metin}
          </pre>
          {ileti.kirpildi ? (
            <p className="border-t border-line px-3 py-1.5 text-xs text-muted">
              İleti uzun olduğu için kırpıldı — tamamı kutuda.
            </p>
          ) : null}
          <div className="border-t border-line px-3 py-2 text-xs">
            <a href={`mailto:${adresAyikla(ileti.kimden)}?subject=${encodeURIComponent(yanitKonusu(ileti.konu))}`} className="font-semibold text-accent underline underline-offset-4">
              Yanıtla
            </a>
            {firmaId ? (
              <>
                {" · "}
                <Link href={`/admin/firmalar/${firmaId}`} className="underline underline-offset-4">
                  firma sayfası
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : durum !== "acik" && ozet ? (
        <p className="text-sm text-muted">{ozet.slice(0, 300)}</p>
      ) : null}
    </div>
  );
}

const adresAyikla = (s: string) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim();
const yanitKonusu = (k: string) => (/^re:/i.test(k) ? k : `RE: ${k}`);
