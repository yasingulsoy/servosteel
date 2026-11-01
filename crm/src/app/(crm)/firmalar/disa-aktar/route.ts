import { sayi } from "@/lib/bicim";
import { csv, csvCevabi } from "@/lib/csv";
import { sorgu } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { oturum } from "@/lib/oturum";
import { FIRMA_DURUMU, KANAL, POTANSIYEL, TAKIP } from "@/lib/sabitler";
import { bolgesi } from "@/lib/ulkeler";
import { firmalar } from "@/lib/veri";

/** Firma listesi Excel'e — listedeki süzgeçlerin aynısıyla, sınırsız. */
export async function GET(istek: Request) {
  const ben = await oturum();
  if (!ben) return new Response("Giriş gerekli", { status: 401 });
  const u = new URL(istek.url).searchParams;
  const deger = (ad: string) => (u.get(ad) ?? "").trim();
  const liste = await firmalar(
    {
      q: deger("q").slice(0, 100),
      ulke: deger("ulke"),
      ilgi: deger("ilgi"),
      potansiyel: deger("potansiyel"),
      etkinlik: sayi(u.get("etkinlik")),
      takip: deger("takip"),
      kanal: deger("kanal"),
    },
    100_000
  );
  const ekler = new Map(
    (
      await sorgu<{ firma_id: number; kisiler: string | null; kanallar: string | null; sorumlu: string | null; durum: string }>(
        `SELECT f.id AS firma_id, f.sorumlu, f.durum,
                (SELECT string_agg(concat_ws(' ', k.ad, NULLIF('<' || k.eposta || '>', '<>'), k.telefon), ' | ' ORDER BY k.id)
                   FROM crm_kisi k WHERE k.firma_id = f.id) AS kisiler,
                (SELECT string_agg(DISTINCT t.kanal, ',') FROM crm_temas t WHERE t.firma_id = f.id) AS kanallar
           FROM crm_firma f WHERE f.id = ANY($1::int[])`,
        [liste.map((f) => f.id)]
      )
    ).map((r) => [r.firma_id, r])
  );
  const icerik = csv(
    ["No", "Firma", "Ülke", "Bölge", "Web", "Sektör", "Potansiyel", "Durum", "Sorumlu", "İlgi alanları", "Kurum yetkilileri", "Kanal", "Etkinlik", "Son takip", "Son temas"],
    liste.map((f) => {
      const e = ekler.get(f.id);
      return [
        f.id,
        f.ad,
        f.ulke,
        f.bolge ?? bolgesi(f.ulke),
        f.web,
        f.sektor,
        POTANSIYEL[f.potansiyel],
        e ? FIRMA_DURUMU[e.durum as keyof typeof FIRMA_DURUMU] : "",
        e?.sorumlu,
        f.ilgiler.join(", "),
        e?.kisiler,
        e?.kanallar
          ?.split(",")
          .map((k) => KANAL[k as keyof typeof KANAL] ?? k)
          .join(", "),
        f.etkinlikler.join(", "),
        f.takip ? TAKIP[f.takip] : "",
        f.son_temas,
      ];
    })
  );
  await kayitEkle(ben, "disa_aktar", "firmalar", `${liste.length} firma`);
  return csvCevabi("crm-firmalar", icerik);
}
