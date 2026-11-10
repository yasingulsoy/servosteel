import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { EtkinlikFormu, HizliKayitFormu } from "@/components/formlar";
import { IlgiEtiketleri, PotansiyelRozeti } from "@/components/rozet";
import { Bos, Panel, SayfaBasligi, Uyari } from "@/components/sayfa";
import { TakipSecici } from "@/components/takip-secici";
import { sayi, tarihAraligi } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { ETKINLIK_TURU, TAKIP, TAKIP_RENK } from "@/lib/sabitler";
import { etkinlik, etkinlikler, etkinlikTemaslari, firma, ilgiAlanlari } from "@/lib/veri";
import { hizliKayit, takipDegistir } from "../../firmalar/actions";
import { etkinlikKaydet, etkinlikSil } from "../actions";

export async function generateMetadata(props: PageProps<"/etkinlikler/[id]">): Promise<Metadata> {
  const no = sayi((await props.params).id);
  const e = no ? await etkinlik(no) : null;
  return { title: e?.ad ?? "Etkinlik" };
}

export default async function EtkinlikSayfasi(props: PageProps<"/etkinlikler/[id]">) {
  const ben = await oturumZorunlu();
  const no = sayi((await props.params).id);
  const sp = await props.searchParams;
  if (!no) notFound();
  const e = await etkinlik(no);
  if (!e) notFound();

  const [temaslar, ilgiler, tumEtkinlikler] = await Promise.all([
    etkinlikTemaslari(no),
    ilgiAlanlari(),
    etkinlikler(),
  ]);
  const eklenenNo = sayi(sp.eklendi);
  const eklenen = eklenenNo ? await firma(eklenenNo) : null;
  const filtre = typeof sp.takip === "string" && sp.takip in TAKIP ? (sp.takip as keyof typeof TAKIP) : null;
  const gorunen = filtre ? temaslar.filter((t) => t.takip === filtre) : temaslar;
  const sayac = new Map<keyof typeof TAKIP, number>();
  for (const t of temaslar) sayac.set(t.takip, (sayac.get(t.takip) ?? 0) + 1);
  const firmaSayisi = new Set(temaslar.map((t) => t.firma_id)).size;
  const yaz = yazabilir(ben);

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik={e.ad} yol={[{ ad: "Etkinlikler", href: "/etkinlikler" }]} konum="Etkinlik">
        <p className="text-sm text-gray-500">
          {ETKINLIK_TURU[e.tur]} · {tarihAraligi(e.baslangic, e.bitis)}
          {e.sehir ? ` · ${e.sehir}` : ""}
          {e.ulke ? `, ${e.ulke}` : ""}
          {e.yer ? ` · ${e.yer}` : ""}
        </p>
        {e.aciklama ? <p className="max-w-3xl text-sm whitespace-pre-line text-gray-600">{e.aciklama}</p> : null}
      </SayfaBasligi>

      {eklenen ? (
        <Uyari tur="basari" simge={CheckCircle2}>
          {sp.mevcut ? "Mevcut firmaya eklendi: " : "Kaydedildi: "}
          <Link href={`/firmalar/${eklenen.id}`} className="font-semibold text-gray-800 underline hover:text-brand-500">
            {eklenen.ad}
          </Link>
        </Uyari>
      ) : null}

      {yaz ? (
        <details className="kart p-5" open={temaslar.length === 0 || Boolean(eklenen)}>
          <summary className="kart-baslik">Firma ekle</summary>
          <div className="mt-5 border-t border-gray-100 pt-5">
            <HizliKayitFormu
              eylem={hizliKayit}
              ilgiler={ilgiler}
              etkinlikler={tumEtkinlikler}
              etkinlikId={e.id}
              geri="etkinlik"
            />
          </div>
        </details>
      ) : null}

      <Panel
        baslik={`${firmaSayisi} firma · ${temaslar.length} görüşme`}
        ek={
          <>
            <Link
              href={`/etkinlikler/${e.id}`}
              className={`cip ${filtre ? "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50" : "bg-brand-500 text-white"}`}
            >
              Hepsi
            </Link>
            {(Object.keys(TAKIP) as (keyof typeof TAKIP)[])
              .filter((k) => sayac.get(k))
              .map((k) => (
                <Link key={k} href={`/etkinlikler/${e.id}?takip=${k}`} className={`cip ${TAKIP_RENK[k]} ${filtre === k ? "cip-secili" : ""}`}>
                  {TAKIP[k]} {sayac.get(k)}
                </Link>
              ))}
          </>
        }
      >
        {gorunen.length === 0 ? (
          <Bos>Bu etkinlikte kayıtlı görüşme yok.</Bos>
        ) : (
          <div className="overflow-x-auto">
            <table className="tablo min-w-[860px]">
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Kurum yetkilisi</th>
                  <th>İlgi / talep</th>
                  <th>Takip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gorunen.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td>
                      <Link href={`/firmalar/${t.firma_id}`} className="font-medium text-gray-800 hover:text-brand-500">
                        {t.firma_ad}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-theme-xs text-gray-500">
                        {t.firma_ulke ?? "ülke yok"}
                        <PotansiyelRozeti p={t.potansiyel} />
                      </div>
                    </td>
                    <td>
                      <div className="text-gray-700">{t.kisi_ad ?? <span className="text-gray-400">—</span>}</div>
                      {t.kisi_unvan ? <div className="text-theme-xs text-gray-500">{t.kisi_unvan}</div> : null}
                      {t.kisi_eposta ? (
                        <a href={`mailto:${t.kisi_eposta}`} className="block text-theme-xs text-gray-500 hover:text-brand-500">
                          {t.kisi_eposta}
                        </a>
                      ) : null}
                    </td>
                    <td className="max-w-md">
                      <IlgiEtiketleri ilgiler={t.ilgiler} />
                      {t.talep ? <p className="mt-1 text-gray-600">{t.talep}</p> : null}
                    </td>
                    <td>
                      <TakipSecici
                        eylem={takipDegistir}
                        temasId={t.id}
                        takip={t.takip}
                        geri={`/etkinlikler/${e.id}${filtre ? `?takip=${filtre}` : ""}`}
                        yazabilir={yaz}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {yaz ? (
        <details className="kart p-5">
          <summary className="kart-baslik">Etkinlik bilgilerini düzenle</summary>
          <div className="mt-5 border-t border-gray-100 pt-5 space-y-4">
            <EtkinlikFormu eylem={etkinlikKaydet} e={e} />
            {ben.rol === "yonetici" && temaslar.length === 0 ? (
              <form action={etkinlikSil}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="dugme-tehlike">
                  Etkinliği sil
                </button>
              </form>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}
