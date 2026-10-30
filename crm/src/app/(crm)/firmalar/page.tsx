import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { IlgiEtiketleri, PotansiyelRozeti, TakipRozeti } from "@/components/rozet";
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Firmalar</h1>
        <span className="text-sm text-muted">{liste.length}{liste.length === 500 ? "+" : ""} kayıt</span>
        {yazabilir(ben) ? (
          <Link href="/firmalar/yeni" className="dugme ml-auto">
            <Plus size={15} /> Firma ekle
          </Link>
        ) : null}
      </div>

      <form className="kart grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
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
            <Search size={15} /> Filtrele
          </button>
          {filtreli ? (
            <Link href="/firmalar" className="dugme-ikincil">
              Temizle
            </Link>
          ) : null}
        </div>
      </form>

      {liste.length === 0 ? (
        <p className="text-sm text-muted">{filtreli ? "Bu filtreye uyan firma yok." : "Henüz firma yok."}</p>
      ) : (
        <div className="kart overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">Firma</th>
                <th className="p-3">Ülke</th>
                <th className="p-3">İlgi alanları</th>
                <th className="p-3">Son durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {liste.map((f) => (
                <tr key={f.id} className="align-top">
                  <td className="p-3">
                    <Link href={`/firmalar/${f.id}`} className="font-semibold hover:underline">
                      {f.ad}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <PotansiyelRozeti p={f.potansiyel} />
                      {f.sektor ? <span>{f.sektor}</span> : null}
                      <span>· {f.kisi_sayisi} kişi</span>
                    </div>
                    {f.etkinlikler.length ? <div className="mt-0.5 text-xs text-muted">{f.etkinlikler.join(", ")}</div> : null}
                  </td>
                  <td className="p-3">
                    {f.ulke ?? <span className="text-muted">—</span>}
                    {f.bolge ?? bolgesi(f.ulke) ? <div className="text-xs text-muted">{f.bolge ?? bolgesi(f.ulke)}</div> : null}
                  </td>
                  <td className="max-w-sm p-3">
                    <IlgiEtiketleri ilgiler={f.ilgiler} />
                  </td>
                  <td className="p-3">
                    <TakipRozeti takip={f.takip} />
                    {f.son_temas ? <div className="mt-0.5 text-xs text-muted">{tarih(f.son_temas)}</div> : null}
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
