import type { Metadata } from "next";
import Link from "next/link";
import { Rozet } from "@/components/rozet";
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
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Servis talepleri</h1>
      <p className="max-w-3xl text-sm text-muted">
        Talep firma kartından açılır (makine, tür, açıklama). Garanti bitişi girilmiş makinede talebin garanti
        kapsamında olup olmadığı kendiliğinden görünür.
      </p>
      <div className="flex gap-2">
        <Link href="/servis" className={`rounded-full px-3 py-1 text-xs font-medium ${kapali ? "bg-card ring-1 ring-line" : "bg-shell text-white"}`}>
          Açık
        </Link>
        <Link href="/servis?k=1" className={`rounded-full px-3 py-1 text-xs font-medium ${kapali ? "bg-shell text-white" : "bg-card ring-1 ring-line"}`}>
          Kapananlar
        </Link>
      </div>
      {liste.length === 0 ? (
        <p className="text-sm text-muted">{kapali ? "Kapanan talep yok." : "Açık servis talebi yok."}</p>
      ) : (
        <ul className="kart divide-y divide-line">
          {liste.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/firmalar/${s.firma_id}`} className="font-semibold hover:underline">
                  {s.firma_ad}
                </Link>
                <span className="text-muted">
                  {s.firma_ulke ? ` · ${s.firma_ulke}` : ""} · {SERVIS_TURU[s.tur]}
                  {s.makine_ad ? ` · ${s.makine_ad}` : ""}
                  {s.seri_no ? ` (SN ${s.seri_no})` : ""}
                </span>
                <p className="mt-0.5 line-clamp-2">{s.aciklama}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Rozet sinif={SERVIS_RENK[s.durum]}>{SERVIS_DURUMU[s.durum]}</Rozet>
                {s.garantide ? <Rozet sinif="bg-emerald-100 text-emerald-900">garantide</Rozet> : null}
                <span className="text-xs text-muted">
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
