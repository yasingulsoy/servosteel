import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { IlgiEtiketleri, TakipRozeti } from "@/components/rozet";
import { tarih, tarihAraligi } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { KANAL } from "@/lib/sabitler";
import { bekleyenTemaslar, etkinlikler, kanalOzeti, panoSayilari } from "@/lib/veri";

export default async function Pano() {
  const ben = await oturumZorunlu();
  const [s, bekleyen, ets, kanallar] = await Promise.all([panoSayilari(), bekleyenTemaslar(), etkinlikler(), kanalOzeti()]);

  const kutular = [
    { ad: "Firma", deger: s.firma, href: "/firmalar" },
    { ad: "Yeni talep", deger: s.yeni, href: "/firmalar?takip=yeni" },
    { ad: "Teklif verilecek", deger: s.teklif_verilecek, href: "/firmalar?takip=teklif_verilecek" },
    { ad: "Bilgi / çizim bekleyen", deger: s.bilgi_bekleyen, href: "/firmalar?takip=teknik_bilgi_istendi" },
    { ad: "Açık teklif", deger: s.acik_teklif, href: "/teklifler?durum=gonderildi" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Pano</h1>
        {yazabilir(ben) ? (
          <div className="ml-auto flex gap-2">
            <Link href="/etkinlikler" className="dugme-ikincil">
              <CalendarDays size={15} /> Etkinlikler
            </Link>
            <Link href="/firmalar/yeni" className="dugme">
              <Plus size={15} /> Firma ekle
            </Link>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kutular.map((k) => (
          <Link key={k.ad} href={k.href} className="kart p-4 hover:border-zinc-400">
            <p className="text-2xl font-bold">{k.deger}</p>
            <p className="text-xs text-muted">{k.ad}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Bekleyen işler</h2>
        {bekleyen.length === 0 ? (
          <p className="text-sm text-muted">Teklif, çizim ya da teknik bilgi bekleyen görüşme yok.</p>
        ) : (
          <ul className="kart divide-y divide-line">
            {bekleyen.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/firmalar/${t.firma_id}`} className="font-semibold hover:underline">
                    {t.firma_ad}
                  </Link>
                  <span className="text-sm text-muted">
                    {t.firma_ulke ? ` · ${t.firma_ulke}` : ""}
                    {t.kisi_ad ? ` · ${t.kisi_ad}` : ""}
                    {t.etkinlik_ad ? ` · ${t.etkinlik_ad}` : ""}
                  </span>
                  {t.talep ? <p className="mt-0.5 text-sm">{t.talep}</p> : null}
                  <div className="mt-1">
                    <IlgiEtiketleri ilgiler={t.ilgiler} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <TakipRozeti takip={t.takip} />
                  {t.son_temas ? <span className="text-xs text-muted">son temas {tarih(t.son_temas)}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {kanallar.length ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Nereden geliyor</h2>
          <div className="kart overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Kanal</th>
                  <th className="p-3 text-right">Firma</th>
                  <th className="p-3 text-right">Görüşme</th>
                  <th className="p-3 text-right">Teklif giden firma</th>
                  <th className="p-3 text-right">Kabul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {kanallar.map((k) => (
                  <tr key={k.kanal}>
                    <td className="p-3">
                      <Link href={`/firmalar?kanal=${k.kanal}`} className="font-medium hover:underline">
                        {KANAL[k.kanal]}
                      </Link>
                    </td>
                    <td className="p-3 text-right">{k.firma}</td>
                    <td className="p-3 text-right">{k.temas}</td>
                    <td className="p-3 text-right">{k.teklif}</td>
                    <td className="p-3 text-right">{k.kabul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Etkinlikler</h2>
        {ets.length === 0 ? (
          <p className="text-sm text-muted">
            Henüz etkinlik yok. <Link href="/etkinlikler" className="underline">İlk etkinliği oluşturun.</Link>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ets.slice(0, 6).map((e) => (
              <Link key={e.id} href={`/etkinlikler/${e.id}`} className="kart p-4 hover:border-zinc-400">
                <p className="font-semibold">{e.ad}</p>
                <p className="text-xs text-muted">
                  {tarihAraligi(e.baslangic, e.bitis)}
                  {e.sehir ? ` · ${e.sehir}` : ""}
                </p>
                <p className="mt-2 text-sm">
                  {e.firma_sayisi} firma · {e.kisi_sayisi} kişi
                  {e.teklif_sayisi ? ` · ${e.teklif_sayisi} teklif bekliyor` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
