import type { Metadata } from "next";
import Link from "next/link";
import { SayfaBasligi } from "@/components/sayfa";
import { sorgu } from "@/lib/db";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { KANAL } from "@/lib/sabitler";
import { HuniPanosu, type HuniKarti } from "./pano";

export const metadata: Metadata = { title: "Satış hunisi" };

export default async function HuniSayfasi(props: PageProps<"/huni">) {
  const ben = await oturumZorunlu();
  const sp = await props.searchParams;
  const kim = sp.kim === "ben" ? "ben" : "hepsi";
  const kanal = typeof sp.kanal === "string" && sp.kanal in KANAL ? sp.kanal : null;
  const olumsuz = sp.olumsuz === "1";

  const kartlar = await sorgu<HuniKarti>(
    `SELECT t.id, t.firma_id AS "firmaId", f.ad AS firma, f.ulke, f.sorumlu, f.potansiyel, t.takip, t.kanal,
            left(t.talep, 160) AS talep, k.ad AS kisi, e.ad AS etkinlik,
            ((now() AT TIME ZONE 'Europe/Istanbul')::date - coalesce(t.son_temas, t.tarih, t.olusturuldu::date))::int AS gun,
            (SELECT count(*) FROM crm_gorev g WHERE g.temas_id = t.id AND g.durum = 'acik')::int AS gorev
       FROM crm_temas t
       JOIN crm_firma f ON f.id = t.firma_id
       LEFT JOIN crm_kisi k ON k.id = t.kisi_id
       LEFT JOIN crm_etkinlik e ON e.id = t.etkinlik_id
      WHERE ($1::text IS NULL OR f.sorumlu = $1)
        AND ($2::text IS NULL OR t.kanal = $2)
        AND ($3 OR t.takip <> 'olumsuz')
      ORDER BY gun DESC NULLS LAST, t.id`,
    [kim === "ben" ? ben.kullanici : null, kanal, olumsuz],
  );

  const bag = (deg: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const tum = { kim, kanal, olumsuz: olumsuz ? "1" : null, ...deg };
    for (const [a, d] of Object.entries(tum)) if (d && !(a === "kim" && d === "hepsi")) q.set(a, d);
    const s = q.toString();
    return s ? `/huni?${s}` : "/huni";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Satış hunisi" yol={[]}>
        <p className="max-w-3xl text-sm text-gray-500">
          Her kart bir görüşme. Kartı sürükleyip başka aşamaya bırakın (telefonda kartın altındaki seçimden).
          &quot;Teklif verilecek&quot;e geçen görüşmeye 3 gün sonrasına &quot;Teklif hazırla&quot; görevi kendiliğinden
          açılır. Sayı, son temastan bu yana geçen gün; 14 günü geçen kırmızı.
        </p>
      </SayfaBasligi>

      <div className="flex flex-wrap items-center gap-2">
        <div className="sekmeler">
          <Link href={bag({ kim: "hepsi" })} className={`sekme ${kim === "hepsi" ? "sekme-etkin" : ""}`}>
            Herkesin
          </Link>
          <Link href={bag({ kim: "ben" })} className={`sekme ${kim === "ben" ? "sekme-etkin" : ""}`}>
            Benim
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={bag({ kanal: null })} className={`cip bg-gray-100 text-gray-700 hover:bg-gray-200 ${!kanal ? "cip-secili" : ""}`}>
            Bütün kanallar
          </Link>
          {Object.entries(KANAL).map(([k, ad]) => (
            <Link key={k} href={bag({ kanal: k })} className={`cip bg-gray-100 text-gray-700 hover:bg-gray-200 ${kanal === k ? "cip-secili" : ""}`}>
              {ad}
            </Link>
          ))}
        </div>
        <Link href={bag({ olumsuz: olumsuz ? null : "1" })} className={`cip ms-auto bg-gray-100 text-gray-700 hover:bg-gray-200 ${olumsuz ? "cip-secili" : ""}`}>
          Olumsuzları {olumsuz ? "gizle" : "göster"}
        </Link>
      </div>

      <HuniPanosu kartlar={kartlar} olumsuz={olumsuz} yazabilir={yazabilir(ben)} />
    </div>
  );
}
