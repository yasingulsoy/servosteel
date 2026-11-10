import Link from "next/link";
import { Building2, CalendarDays, FileClock, Inbox, PencilRuler, Plus, Send } from "lucide-react";
import { IlgiEtiketleri, Rozet, TakipRozeti } from "@/components/rozet";
import { Bos, Panel, SayfaBasligi, SayiKarti } from "@/components/sayfa";
import { tarih, tarihAraligi } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { GorevListesi } from "@/components/gorev-listesi";
import { KANAL } from "@/lib/sabitler";
import { bekleyenTemaslar, etkinlikler, kanalOzeti, panoSayilari, vadesiGelenGorevler } from "@/lib/veri";
import { gorevDurum } from "./gorevler/actions";

export default async function Pano() {
  const ben = await oturumZorunlu();
  const [s, bekleyen, ets, kanallar, gorevlerim] = await Promise.all([
    panoSayilari(),
    bekleyenTemaslar(),
    etkinlikler(),
    kanalOzeti(),
    vadesiGelenGorevler(ben.kullanici),
  ]);

  const kutular = [
    { ad: "Firma", deger: s.firma, href: "/firmalar", simge: Building2 },
    { ad: "Yeni talep", deger: s.yeni, href: "/firmalar?takip=yeni", simge: Inbox },
    { ad: "Teklif verilecek", deger: s.teklif_verilecek, href: "/firmalar?takip=teklif_verilecek", simge: FileClock },
    { ad: "Bilgi / çizim bekleyen", deger: s.bilgi_bekleyen, href: "/firmalar?takip=teknik_bilgi_istendi", simge: PencilRuler },
    { ad: "Açık teklif", deger: s.acik_teklif, href: "/teklifler?durum=gonderildi", simge: Send },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi
        baslik="Pano"
        ek={
          yazabilir(ben) ? (
            <>
              <Link href="/etkinlikler" className="dugme-ikincil">
                <CalendarDays size={18} /> Etkinlikler
              </Link>
              <Link href="/firmalar/yeni" className="dugme">
                <Plus size={18} /> Firma ekle
              </Link>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-5">
        {kutular.map((k) => (
          <SayiKarti key={k.ad} ad={k.ad} deger={k.deger} simge={k.simge} href={k.href} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <Panel
          baslik="Bugün ve yarın: görevlerim"
          className="col-span-12 xl:col-span-7"
          ek={
            <Link href="/gorevler" className="dugme-kucuk">
              Tümünü gör
            </Link>
          }
        >
          <GorevListesi gorevler={gorevlerim} durumEylemi={gorevDurum} geri="/" yazabilir={yazabilir(ben)} cerceve={false} />
        </Panel>

        <Panel
          baslik="Etkinlikler"
          className="col-span-12 xl:col-span-5"
          ek={
            <Link href="/etkinlikler" className="dugme-kucuk">
              Tümünü gör
            </Link>
          }
        >
          {ets.length === 0 ? (
            <Bos>
              Henüz etkinlik yok.{" "}
              <Link href="/etkinlikler" className="font-medium text-brand-500 hover:text-brand-600">
                İlk etkinliği oluşturun.
              </Link>
            </Bos>
          ) : (
            <ul className="divide-y divide-gray-100">
              {ets.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <Link href={`/etkinlikler/${e.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 sm:px-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                      <CalendarDays size={20} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-theme-sm font-medium text-gray-800">{e.ad}</span>
                      <span className="block text-theme-xs text-gray-500">
                        {tarihAraligi(e.baslangic, e.bitis)}
                        {e.sehir ? ` · ${e.sehir}` : ""} · {e.firma_sayisi} firma · {e.kisi_sayisi} kişi
                      </span>
                    </span>
                    {e.teklif_sayisi ? (
                      <Rozet sinif="bg-warning-50 text-warning-600">{e.teklif_sayisi} teklif bekliyor</Rozet>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel baslik="Bekleyen işler">
        {bekleyen.length === 0 ? (
          <Bos>Teklif, çizim ya da teknik bilgi bekleyen görüşme yok.</Bos>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bekleyen.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-4 sm:px-6">
                <div className="min-w-0 flex-1">
                  <Link href={`/firmalar/${t.firma_id}`} className="text-theme-sm font-medium text-gray-800 hover:text-brand-500">
                    {t.firma_ad}
                  </Link>
                  <span className="text-theme-sm text-gray-500">
                    {t.firma_ulke ? ` · ${t.firma_ulke}` : ""}
                    {t.kisi_ad ? ` · ${t.kisi_ad}` : ""}
                    {t.etkinlik_ad ? ` · ${t.etkinlik_ad}` : ""}
                  </span>
                  {t.talep ? <p className="mt-0.5 text-theme-sm text-gray-600">{t.talep}</p> : null}
                  <div className="mt-1.5">
                    <IlgiEtiketleri ilgiler={t.ilgiler} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <TakipRozeti takip={t.takip} />
                  {t.son_temas ? <span className="text-theme-xs text-gray-500">son temas {tarih(t.son_temas)}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {kanallar.length ? (
        <Panel baslik="Nereden geliyor">
          <div className="overflow-x-auto">
            <table className="tablo min-w-[480px]">
              <thead>
                <tr>
                  <th>Kanal</th>
                  <th className="text-right">Firma</th>
                  <th className="text-right">Görüşme</th>
                  <th className="text-right">Teklif giden firma</th>
                  <th className="text-right">Kabul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kanallar.map((k) => (
                  <tr key={k.kanal}>
                    <td>
                      <Link href={`/firmalar?kanal=${k.kanal}`} className="font-medium text-gray-800 hover:text-brand-500">
                        {KANAL[k.kanal]}
                      </Link>
                    </td>
                    <td className="text-right">{k.firma}</td>
                    <td className="text-right">{k.temas}</td>
                    <td className="text-right">{k.teklif}</td>
                    <td className="text-right">{k.kabul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
