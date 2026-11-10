import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { IlgiEtiketleri, PotansiyelRozeti, Rozet, TakipRozeti } from "@/components/rozet";
import { Bos, SayfaBasligi } from "@/components/sayfa";
import { sayi, tarih } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { KANAL, POTANSIYEL, TAKIP } from "@/lib/sabitler";
import { bolgesi } from "@/lib/ulkeler";
import { etkinlikler, firmalar, ilgiAlanlari, kullanilanUlkeler } from "@/lib/veri";

export const metadata: Metadata = { title: "Firmalar" };

const tekDeger = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function FirmaListesi(props: PageProps<"/firmalar">) {
  const ben = await oturumZorunlu();
  const sp = await props.searchParams;
  const filtre = {
    q: tekDeger(sp.q).slice(0, 100),
    ulke: tekDeger(sp.ulke),
    ilgi: tekDeger(sp.ilgi),
    potansiyel: tekDeger(sp.potansiyel),
    etkinlik: sayi(sp.etkinlik),
    takip: tekDeger(sp.takip),
    kanal: tekDeger(sp.kanal),
  };
  const [liste, ulkeler, ilgiler, ets] = await Promise.all([
    firmalar(filtre),
    kullanilanUlkeler(),
    ilgiAlanlari(),
    etkinlikler(),
  ]);
  const filtreli = Object.values(filtre).some(Boolean);
  /* Excel'e aktarma ekrandaki süzgeçle aynı listeyi verir (sınırsız). */
  const aktarSorgusu = new URLSearchParams(
    Object.entries(filtre).flatMap(([k, v]) => (v ? [[k, String(v)]] : []))
  ).toString();

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi
        baslik="Firmalar"
        yanina={
          <Rozet sinif="bg-gray-100 text-gray-700">
            {liste.length}
            {liste.length === 500 ? "+" : ""} kayıt
          </Rozet>
        }
        ek={
          <>
            <a href={`/firmalar/disa-aktar${aktarSorgusu ? `?${aktarSorgusu}` : ""}`} className="dugme-ikincil">
              <Download size={18} /> Excel
            </a>
            {yazabilir(ben) ? (
              <Link href="/firmalar/yeni" className="dugme">
                <Plus size={18} /> Firma ekle
              </Link>
            ) : null}
          </>
        }
      />

      <form className="kart grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <label className="etiket" htmlFor="q">
            Ara
          </label>
          <input id="q" name="q" defaultValue={filtre.q} placeholder="Firma, kişi, e-posta, web…" className="alan" />
        </div>
        <Secici ad="ulke" etiket="Ülke" deger={filtre.ulke} secenekler={ulkeler.map((u) => [u, u])} />
        <Secici ad="ilgi" etiket="İlgi alanı" deger={filtre.ilgi} secenekler={ilgiler.map((i) => [i.kod, i.ad])} />
        <Secici ad="etkinlik" etiket="Etkinlik" deger={filtre.etkinlik ?? ""} secenekler={ets.map((e) => [String(e.id), e.ad])} />
        <Secici ad="takip" etiket="Takip" deger={filtre.takip} secenekler={Object.entries(TAKIP)} />
        <Secici ad="potansiyel" etiket="Potansiyel" deger={filtre.potansiyel} secenekler={Object.entries(POTANSIYEL)} />
        <Secici ad="kanal" etiket="Nereden geldi" deger={filtre.kanal} secenekler={Object.entries(KANAL)} />
        <div className="flex items-end gap-2 lg:col-span-4">
          <button type="submit" className="dugme">
            <Search size={18} /> Filtrele
          </button>
          {filtreli ? (
            <Link href="/firmalar" className="dugme-ikincil">
              Temizle
            </Link>
          ) : null}
        </div>
      </form>

      {liste.length === 0 ? (
        <div className="kart">
          <Bos>{filtreli ? "Bu filtreye uyan firma yok." : "Henüz firma yok."}</Bos>
        </div>
      ) : (
        <div className="kart overflow-x-auto">
          <table className="tablo min-w-[820px]">
            <thead>
              <tr>
                <th>Firma</th>
                <th>Ülke</th>
                <th>İlgi alanları</th>
                <th>Son durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {liste.map((f) => (
                <tr key={f.id} className="align-top">
                  <td>
                    <Link href={`/firmalar/${f.id}`} className="font-medium text-gray-800 hover:text-brand-500">
                      {f.ad}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-theme-xs text-gray-500">
                      <PotansiyelRozeti p={f.potansiyel} />
                      {f.sektor ? <span>{f.sektor}</span> : null}
                      <span>· {f.kisi_sayisi} kişi</span>
                    </div>
                    {f.etkinlikler.length ? <div className="mt-1 text-theme-xs text-gray-500">{f.etkinlikler.join(", ")}</div> : null}
                  </td>
                  <td>
                    <span className="text-gray-700">{f.ulke ?? <span className="text-gray-400">—</span>}</span>
                    {f.bolge ?? bolgesi(f.ulke) ? <div className="text-theme-xs text-gray-500">{f.bolge ?? bolgesi(f.ulke)}</div> : null}
                  </td>
                  <td className="max-w-sm">
                    <IlgiEtiketleri ilgiler={f.ilgiler} />
                  </td>
                  <td>
                    <TakipRozeti takip={f.takip} />
                    {f.son_temas ? <div className="mt-1 text-theme-xs text-gray-500">{tarih(f.son_temas)}</div> : null}
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

function Secici({
  ad,
  etiket,
  deger,
  secenekler,
}: {
  ad: string;
  etiket: string;
  deger: string | number;
  secenekler: string[][];
}) {
  return (
    <div>
      <label className="etiket" htmlFor={`f-${ad}`}>
        {etiket}
      </label>
      <select id={`f-${ad}`} name={ad} defaultValue={String(deger)} className="alan">
        <option value="">Hepsi</option>
        {secenekler.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}
