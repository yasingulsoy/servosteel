import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Rozet } from "@/components/rozet";
import { Bos, SayfaBasligi } from "@/components/sayfa";
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
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi
        baslik="Teklifler"
        ek={
          <a href={`/teklifler/disa-aktar${durum ? `?durum=${durum}` : ""}`} className="dugme-ikincil">
            <Download size={18} /> Excel
          </a>
        }
      >
        <p className="max-w-3xl text-sm text-gray-500">
          Teklif firma kartından eklenir: satış teklifi kendi dosyasında hazırlar, burada PDF&apos;i, tutarı ve durumu durur.
        </p>
      </SayfaBasligi>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/teklifler"
          className={`cip ${durum ? "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50" : "bg-brand-500 text-white"}`}
        >
          Hepsi
        </Link>
        {ozet.map((o) => (
          <Link
            key={o.d}
            href={`/teklifler?durum=${o.d}`}
            className={`cip ${TEKLIF_RENK[o.d]} ${durum === o.d ? "cip-secili" : ""}`}
          >
            {TEKLIF_DURUMU[o.d]} {o.adet}
            {o.tutar ? ` · ${o.tutar}` : ""}
          </Link>
        ))}
      </div>

      {liste.length === 0 ? (
        <div className="kart">
          <Bos>{durum ? "Bu durumda teklif yok." : "Henüz teklif girilmedi."}</Bos>
        </div>
      ) : (
        <div className="kart overflow-x-auto">
          <table className="tablo min-w-[820px]">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Firma</th>
                <th>Teklif</th>
                <th className="text-right">Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {liste.map((t) => (
                <tr key={t.id} className="align-top">
                  <td className="whitespace-nowrap">
                    {tarih(t.tarih)}
                    {t.gecerlilik ? <div className="text-theme-xs text-gray-500">geçerlilik {tarih(t.gecerlilik)}</div> : null}
                  </td>
                  <td>
                    <Link href={`/firmalar/${t.firma_id}`} className="font-medium text-gray-800 hover:text-brand-500">
                      {t.firma_ad}
                    </Link>
                    {t.firma_ulke ? <div className="text-theme-xs text-gray-500">{t.firma_ulke}</div> : null}
                  </td>
                  <td className="max-w-sm">
                    <div className="font-medium text-gray-800">{t.teklif_no ?? "—"}</div>
                    {t.konu ? <div className="text-theme-xs text-gray-500">{t.konu}</div> : null}
                    {t.dosya_id ? (
                      <a
                        href={`/dosya/${t.dosya_id}`}
                        target="_blank"
                        className="mt-1 inline-flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                      >
                        <FileText size={12} /> {t.dosya_ad}
                      </a>
                    ) : null}
                  </td>
                  <td className="text-right font-medium whitespace-nowrap text-gray-800">
                    {t.tutar ? `${para(t.tutar)} ${DOVIZ[t.doviz]}` : "—"}
                  </td>
                  <td>
                    <Rozet sinif={TEKLIF_RENK[t.durum]}>{TEKLIF_DURUMU[t.durum]}</Rozet>
                    {t.red_sebebi ? <div className="mt-1 text-theme-xs text-error-600">{RED_SEBEBI[t.red_sebebi]}</div> : null}
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
