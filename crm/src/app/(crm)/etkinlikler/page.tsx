import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EtkinlikFormu } from "@/components/formlar";
import { Rozet } from "@/components/rozet";
import { Bos, SayfaBasligi } from "@/components/sayfa";
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
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Etkinlikler" yol={[]} />

      {yazabilir(ben) ? (
        <details className="kart p-5" open={ets.length === 0}>
          <summary className="kart-baslik">Yeni etkinlik</summary>
          <div className="mt-5 border-t border-gray-100 pt-5">
            <EtkinlikFormu eylem={etkinlikKaydet} />
          </div>
        </details>
      ) : null}

      {ets.length === 0 ? (
        <div className="kart">
          <Bos>Henüz etkinlik yok.</Bos>
        </div>
      ) : (
        <div className="kart divide-y divide-gray-100 overflow-hidden">
          {ets.map((e) => (
            <Link
              key={e.id}
              href={`/etkinlikler/${e.id}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 hover:bg-gray-50 sm:px-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                <CalendarDays size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-theme-sm font-medium text-gray-800">{e.ad}</p>
                <p className="text-theme-xs text-gray-500">
                  {ETKINLIK_TURU[e.tur]} · {tarihAraligi(e.baslangic, e.bitis)}
                  {e.sehir ? ` · ${e.sehir}` : ""}
                  {e.ulke ? `, ${e.ulke}` : ""}
                  {e.yer ? ` · ${e.yer}` : ""}
                </p>
              </div>
              <p className="flex flex-wrap items-center gap-2 text-theme-sm text-gray-500">
                <span>
                  <b className="font-semibold text-gray-800">{e.firma_sayisi}</b> firma ·{" "}
                  <b className="font-semibold text-gray-800">{e.kisi_sayisi}</b> kişi
                </span>
                {e.teklif_sayisi ? (
                  <Rozet sinif="bg-warning-50 text-warning-600">{e.teklif_sayisi} teklif bekliyor</Rozet>
                ) : null}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
