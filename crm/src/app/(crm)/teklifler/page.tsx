import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Rozet } from "@/components/rozet";
import { para, tarih } from "@/lib/bicim";
import { oturumZorunlu } from "@/lib/oturum";
import { DOVIZ, RED_SEBEBI, TEKLIF_DURUMU, TEKLIF_RENK } from "@/lib/sabitler";
import { teklifler, teklifToplamlari } from "@/lib/veri";

export const metadata: Metadata = { title: "Teklifler" };

export default async function TeklifListesi(props: PageProps<"/teklifler">) {
  await oturumZorunlu();
  const sp = await props.searchParams;
  const durum = typeof sp.durum === "string" && sp.durum in TEKLIF_DURUMU ? sp.durum : undefined;
  const [liste, toplamlar] = await Promise.all([teklifler(durum), teklifToplamlari()]);

  /* Durum başına: adet ve döviz döviz toplam (dövizler birbirine çevrilmez). */
  const ozet = (Object.keys(TEKLIF_DURUMU) as (keyof typeof TEKLIF_DURUMU)[])
    .map((d) => {
      const satirlar = toplamlar.filter((t) => t.durum === d);
      return {
        d,
        adet: satirlar.reduce((a, t) => a + t.adet, 0),
        tutar: satirlar
          .filter((t) => t.toplam)
          .map((t) => `${para(t.toplam)} ${DOVIZ[t.doviz]}`)
          .join(" + "),
      };
    })
    .filter((o) => o.adet);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Teklifler</h1>
      <p className="max-w-3xl text-sm text-muted">
        Teklif firma kartından eklenir: satış teklifi kendi dosyasında hazırlar, burada PDF&apos;i, tutarı ve durumu durur.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/teklifler"
          className={`rounded-full px-3 py-1 text-xs font-medium ${durum ? "bg-card ring-1 ring-line" : "bg-shell text-white"}`}
        >
          Hepsi
        </Link>
        {ozet.map((o) => (
          <Link
            key={o.d}
            href={`/teklifler?durum=${o.d}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${TEKLIF_RENK[o.d]} ${durum === o.d ? "ring-2 ring-zinc-900" : ""}`}
          >
            {TEKLIF_DURUMU[o.d]} {o.adet}
            {o.tutar ? ` · ${o.tutar}` : ""}
          </Link>
        ))}
      </div>

      {liste.length === 0 ? (
        <p className="text-sm text-muted">{durum ? "Bu durumda teklif yok." : "Henüz teklif girilmedi."}</p>
      ) : (
        <div className="kart overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">Tarih</th>
                <th className="p-3">Firma</th>
                <th className="p-3">Teklif</th>
                <th className="p-3 text-right">Tutar</th>
                <th className="p-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {liste.map((t) => (
                <tr key={t.id} className="align-top">
                  <td className="whitespace-nowrap p-3">
                    {tarih(t.tarih)}
                    {t.gecerlilik ? <div className="text-xs text-muted">geçerlilik {tarih(t.gecerlilik)}</div> : null}
                  </td>
                  <td className="p-3">
                    <Link href={`/firmalar/${t.firma_id}`} className="font-semibold hover:underline">
                      {t.firma_ad}
                    </Link>
                    {t.firma_ulke ? <div className="text-xs text-muted">{t.firma_ulke}</div> : null}
                  </td>
                  <td className="max-w-sm p-3">
                    <div className="font-medium">{t.teklif_no ?? "—"}</div>
                    {t.konu ? <div className="text-xs text-muted">{t.konu}</div> : null}
                    {t.dosya_id ? (
                      <a href={`/dosya/${t.dosya_id}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs hover:underline">
                        <FileText size={12} /> {t.dosya_ad}
                      </a>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-semibold">
                    {t.tutar ? `${para(t.tutar)} ${DOVIZ[t.doviz]}` : "—"}
                  </td>
                  <td className="p-3">
                    <Rozet sinif={TEKLIF_RENK[t.durum]}>{TEKLIF_DURUMU[t.durum]}</Rozet>
                    {t.red_sebebi ? <div className="mt-0.5 text-xs text-red-800">{RED_SEBEBI[t.red_sebebi]}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
