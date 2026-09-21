import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HEDEF_DURUM_ETIKET, KATEGORI_ADI, type HedefDurum, type HedefSatiri } from "@/lib/outreach-db";
import { ENGELLI_ULKELER } from "@/lib/outreach-kurallar";
import { goreli, kisaTarih } from "@/lib/zaman";

/**
 * Hedef firma listesi — mobilde KART, masaüstünde TABLO (talep listesiyle
 * aynı gerekçe: altı sütun 375 px'e sığmıyor, ilk kaybolan Durum olurdu).
 */

export const HEDEF_RENK: Record<HedefDurum, string> = {
  bekliyor: "bg-zinc-500/10 text-zinc-600",
  gonderildi: "bg-blue-500/15 text-blue-700",
  yanit: "bg-violet-500/15 text-violet-700",
  olumlu: "bg-emerald-500/15 text-emerald-700",
  red: "bg-zinc-500/15 text-zinc-600",
  iptal: "bg-amber-500/15 text-amber-800",
  hatali: "bg-red-500/15 text-red-700",
  gecildi: "bg-zinc-500/10 text-zinc-500",
};

/** Gönderim denemesinin sonucu — liste ve detay sayfası aynı kelimeyi kullanır. */
export const SONUC_ETIKET: Record<string, string> = {
  ok: "gitti",
  hata: "hata",
  alici: "adres reddedildi",
  belirsiz: "belirsiz (gitmiş olabilir)",
};

export function HedefRozet({ durum }: { durum: HedefDurum }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${HEDEF_RENK[durum] ?? ""}`}>
      {HEDEF_DURUM_ETIKET[durum] ?? durum}
    </span>
  );
}

/** E-posta hücresi: adres, yoksa neden yok. */
function Adres({ s }: { s: HedefSatiri }) {
  if (!s.eposta) return <span className="text-muted">adres yok</span>;
  if (ENGELLI_ULKELER[s.ulke]) {
    return <span className="text-muted" title={ENGELLI_ULKELER[s.ulke]}>e-posta kapalı ülke</span>;
  }
  return <span className="break-all">{s.eposta}</span>;
}

export function FirmaListesi({ liste, sorgu }: { liste: HedefSatiri[]; sorgu: string }) {
  if (liste.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-card px-4 py-12 text-center text-sm text-muted">
        Bu süzgeçte firma yok.
      </p>
    );
  }
  const href = (id: number) => `/admin/firmalar/${id}${sorgu ? `?${sorgu}` : ""}`;

  return (
    <>
      {/* ---------------------------------------------- mobil: kartlar */}
      <ul className="space-y-3 lg:hidden">
        {liste.map((s) => (
          <li key={s.id} className="rounded-xl border border-line bg-card">
            <Link href={href(s.id)} className="flex items-start gap-3 p-4 active:bg-surface-alt">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold leading-tight">{s.firma}</span>
                  <HedefRozet durum={s.durum} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  <Adres s={s} />
                </p>
                <p className="mt-1.5 text-xs text-muted">
                  {[KATEGORI_ADI[s.kategori], s.ulke, s.segmentler, s.kesif ? "otomatik keşif" : "",
                    s.gonderildi ? goreli(s.gonderildi) : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      {/* ------------------------------------------- masaüstü: tablo */}
      <div className="hidden overflow-x-auto rounded-xl border border-line lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt">
            <tr>
              {["Firma", "Grup", "Ülke", "Segment", "E-posta", "Durum", "Gönderim"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.map((s) => (
              <tr key={s.id} className="relative border-t border-line hover:bg-surface-alt">
                <td className="px-4 py-3">
                  {/* Satırın tamamı tıklanır ama sayfada tek bağlantı var —
                      bkz. talep-listesi.tsx */}
                  <Link
                    href={href(s.id)}
                    className="font-medium underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
                  >
                    {s.firma}
                  </Link>
                  {s.kesif ? (
                    <span className="ml-2 rounded bg-surface-alt px-1.5 py-0.5 text-[11px] font-medium text-muted">
                      keşif
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">{KATEGORI_ADI[s.kategori] ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{s.ulke || "—"}</td>
                <td className="px-4 py-3 text-muted">{s.segmentler || "—"}</td>
                <td className="px-4 py-3 text-muted">
                  <Adres s={s} />
                </td>
                <td className="px-4 py-3">
                  <HedefRozet durum={s.durum} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {s.gonderildi ? (
                    <span title={kisaTarih(s.gonderildi)}>{goreli(s.gonderildi)}</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
