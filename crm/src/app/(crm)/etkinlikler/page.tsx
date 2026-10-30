import type { Metadata } from "next";
import Link from "next/link";
import { EtkinlikFormu } from "@/components/formlar";
import { tarihAraligi } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { ETKINLIK_TURU } from "@/lib/sabitler";
import { etkinlikler } from "@/lib/veri";
import { etkinlikKaydet } from "./actions";

export const metadata: Metadata = { title: "Etkinlikler" };

export default async function EtkinlikListesi() {
  const ben = await oturumZorunlu();
  const ets = await etkinlikler();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Etkinlikler</h1>

      {yazabilir(ben) ? (
        <details className="kart p-4" open={ets.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold">Yeni etkinlik</summary>
          <div className="mt-4">
            <EtkinlikFormu eylem={etkinlikKaydet} />
          </div>
        </details>
      ) : null}

      {ets.length === 0 ? (
        <p className="text-sm text-muted">Henüz etkinlik yok.</p>
      ) : (
        <div className="kart divide-y divide-line">
          {ets.map((e) => (
            <Link key={e.id} href={`/etkinlikler/${e.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 hover:bg-surface">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{e.ad}</p>
                <p className="text-xs text-muted">
                  {ETKINLIK_TURU[e.tur]} · {tarihAraligi(e.baslangic, e.bitis)}
                  {e.sehir ? ` · ${e.sehir}` : ""}
                  {e.ulke ? `, ${e.ulke}` : ""}
                  {e.yer ? ` · ${e.yer}` : ""}
                </p>
              </div>
              <p className="text-sm">
                <b>{e.firma_sayisi}</b> firma · <b>{e.kisi_sayisi}</b> kişi
                {e.teklif_sayisi ? (
                  <span className="ml-2 rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-950">
                    {e.teklif_sayisi} teklif bekliyor
                  </span>
                ) : null}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
