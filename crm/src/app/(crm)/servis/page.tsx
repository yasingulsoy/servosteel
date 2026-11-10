import type { Metadata } from "next";
import Link from "next/link";
import { Rozet } from "@/components/rozet";
import { Bos, SayfaBasligi } from "@/components/sayfa";
import { tarih } from "@/lib/bicim";
import { oturumZorunlu } from "@/lib/oturum";
import { SERVIS_DURUMU, SERVIS_RENK, SERVIS_TURU } from "@/lib/sabitler";
import { servisler } from "@/lib/veri";

export const metadata: Metadata = { title: "Servis" };

export default async function ServisSayfasi(props: PageProps<"/servis">) {
  await oturumZorunlu();
  const sp = await props.searchParams;
  const kapali = sp.k === "1";
  const liste = await servisler(!kapali);
  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Servis talepleri" yol={[]}>
        <p className="max-w-3xl text-sm text-gray-500">
          Talep firma kartından açılır (makine, tür, açıklama). Garanti bitişi girilmiş makinede talebin garanti
          kapsamında olup olmadığı kendiliğinden görünür.
        </p>
      </SayfaBasligi>
      <div className="sekmeler">
        <Link href="/servis" className={`sekme ${kapali ? "" : "sekme-etkin"}`}>
          Açık
        </Link>
        <Link href="/servis?k=1" className={`sekme ${kapali ? "sekme-etkin" : ""}`}>
          Kapananlar
        </Link>
      </div>
      {liste.length === 0 ? (
        <div className="kart">
          <Bos>{kapali ? "Kapanan talep yok." : "Açık servis talebi yok."}</Bos>
        </div>
      ) : (
        <ul className="kart divide-y divide-gray-100">
          {liste.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-4 text-sm sm:px-6">
              <div className="min-w-0 flex-1">
                <Link href={`/firmalar/${s.firma_id}`} className="font-medium text-gray-800 hover:text-brand-500">
                  {s.firma_ad}
                </Link>
                <span className="text-gray-500">
                  {s.firma_ulke ? ` · ${s.firma_ulke}` : ""} · {SERVIS_TURU[s.tur]}
                  {s.makine_ad ? ` · ${s.makine_ad}` : ""}
                  {s.seri_no ? ` (SN ${s.seri_no})` : ""}
                </span>
                <p className="mt-1 line-clamp-2 text-gray-700">{s.aciklama}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Rozet sinif={SERVIS_RENK[s.durum]}>{SERVIS_DURUMU[s.durum]}</Rozet>
                {s.garantide ? <Rozet sinif="bg-success-50 text-success-600">garantide</Rozet> : null}
                <span className="text-theme-xs text-gray-500">
                  {tarih(s.acildi)}
                  {s.kapandi ? ` → ${tarih(s.kapandi)}` : ""}
                  {s.atanan ? ` · ${s.atanan}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
