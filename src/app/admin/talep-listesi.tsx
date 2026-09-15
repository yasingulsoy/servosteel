import Link from "next/link";
import { Phone, Mail, ChevronRight } from "lucide-react";
import { DURUM_ETIKET, type Talep } from "@/lib/leads-db";
import { goreli, kisaTarih } from "@/lib/zaman";

/**
 * Talep listesi — mobilde KART, masaüstünde TABLO.
 *
 * Neden iki ayrı düzen: tabloda altı sütun var ve 375 px'e sığmıyordu;
 * yatay kaydırma gerekiyordu ve ekranın dışında kalan ilk sütun **Durum**
 * oluyordu — listeye bakarken en çok aranan bilgi. Tabloyu daraltmak yerine
 * mobilde bırakmak doğrusu.
 *
 * Kartta ARA ve YAZ tuşları var. Panelin telefonda kullanılma sebebi bu:
 * talebi aç, adama dön. Detay sayfasına girip numarayı bulmak fazladan iki
 * adım, ve o iki adım aramanın yapılmamasına yetiyor.
 */

export const DURUM_RENK: Record<string, string> = {
  yeni: "bg-accent/25 text-accent-strong",
  ulasildi: "bg-blue-500/15 text-blue-700",
  bilgi_verildi: "bg-violet-500/15 text-violet-700",
  teklif_gonderildi: "bg-amber-500/15 text-amber-700",
  kazanildi: "bg-emerald-500/15 text-emerald-700",
  kaybedildi: "bg-zinc-500/15 text-zinc-600",
  spam: "bg-red-500/15 text-red-700",
};

function Rozet({ durum }: { durum: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${DURUM_RENK[durum] ?? ""}`}
    >
      {DURUM_ETIKET[durum as keyof typeof DURUM_ETIKET] ?? durum}
    </span>
  );
}

function Bos() {
  return (
    <p className="rounded-xl border border-line bg-card px-4 py-12 text-center text-sm text-muted">
      Kayıt yok.
    </p>
  );
}

export function TalepListesi({ liste }: { liste: Talep[] }) {
  if (liste.length === 0) return <Bos />;

  return (
    <>
      {/* ---------------------------------------------- mobil: kartlar */}
      <ul className="space-y-3 lg:hidden">
        {liste.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-card">
            <Link
              href={`/admin/talep/${t.id}`}
              className="flex items-start gap-3 p-4 active:bg-surface-alt"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold leading-tight">
                    {t.ad || t.eposta || `#${t.id}`}
                  </span>
                  <Rozet durum={t.durum} />
                </div>

                {t.firma ? (
                  <p className="mt-0.5 truncate text-sm text-muted">{t.firma}</p>
                ) : null}

                <p className="mt-1.5 text-xs text-muted">
                  {[
                    t.ulke,
                    t.tur === "rfq" ? "Teklif" : "İletişim",
                    goreli(t.olusturuldu),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
            </Link>

            {/* Doğrudan eylem — detaya girmeden ara ya da yaz */}
            {t.telefon || t.eposta ? (
              <div className="flex border-t border-line">
                {t.telefon ? (
                  <a
                    href={`tel:${t.telefon.replace(/\s/g, "")}`}
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-ink active:bg-surface-alt"
                  >
                    <Phone className="size-4" strokeWidth={2.2} aria-hidden />
                    Ara
                  </a>
                ) : null}
                {t.telefon && t.eposta ? (
                  <span className="w-px bg-line" aria-hidden />
                ) : null}
                {t.eposta ? (
                  <a
                    href={`mailto:${t.eposta}`}
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-ink active:bg-surface-alt"
                  >
                    <Mail className="size-4" strokeWidth={2.2} aria-hidden />
                    Yaz
                  </a>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {/* ------------------------------------------- masaüstü: tablo */}
      <div className="hidden overflow-x-auto rounded-xl border border-line lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt">
            <tr>
              {["Tarih", "Ad", "Firma", "Ülke", "Tür", "Durum"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.map((t) => (
              <tr key={t.id} className="border-t border-line hover:bg-surface-alt">
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  <span title={kisaTarih(t.olusturuldu)}>{goreli(t.olusturuldu)}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/talep/${t.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {t.ad || t.eposta || `#${t.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{t.firma || "—"}</td>
                <td className="px-4 py-3 text-muted">{t.ulke || "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {t.tur === "rfq" ? "Teklif" : "İletişim"}
                  {t.kaynak === "elle" ? " · elle" : ""}
                </td>
                <td className="px-4 py-3">
                  <Rozet durum={t.durum} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
