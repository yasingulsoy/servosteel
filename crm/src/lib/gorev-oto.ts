import type { PoolClient } from "pg";
import type { Kullanici } from "./oturum";

/**
 * Kendiliğinden açılan ve kapanan görevler. Her biri bir kaynağa bağlı
 * ("teklif:12", "temas:40"); aynı kaynaktan ikinci açık görev açılmaz
 * (veritabanında tekil indeks). Görev, firmanın sorumlusuna; sorumlu yoksa
 * işlemi yapana atanır.
 *
 *   teklif gönderildi      → 7 gün sonra "Teklif takibi"
 *   teklif kabul/red/iptal → o görev kapanır
 *   görüşme "teklif verilecek" → 3 gün sonra "Teklif hazırla"
 *   görüşme teklif gönderildi/olumsuz → o görev kapanır
 */

async function ac(
  b: PoolClient,
  g: { kaynak: string; baslik: string; firmaId: number; gun: number; tarih?: string | null; teklifId?: number; temasId?: number },
  ben: Kullanici
) {
  await b.query(
    `INSERT INTO crm_gorev (baslik, firma_id, teklif_id, temas_id, atanan, son_tarih, kaynak, olusturan)
     SELECT $1, $2, $3, $4, COALESCE(f.sorumlu, $5),
            COALESCE($6::date, (now() AT TIME ZONE 'Europe/Istanbul')::date) + $7::int, $8, 'otomatik'
       FROM crm_firma f WHERE f.id = $2
     ON CONFLICT (kaynak) WHERE durum = 'acik' AND kaynak IS NOT NULL DO NOTHING`,
    [g.baslik, g.firmaId, g.teklifId ?? null, g.temasId ?? null, ben.kullanici, g.tarih ?? null, g.gun, g.kaynak]
  );
}

async function kapat(b: PoolClient, kaynak: string) {
  await b.query(
    `UPDATE crm_gorev SET durum = 'tamam', tamamlandi = now(), tamamlayan = 'otomatik'
      WHERE kaynak = $1 AND durum = 'acik'`,
    [kaynak]
  );
}

export async function teklifGorevi(
  b: PoolClient,
  t: { id: number; firmaId: number; durum: string; tarih: string; teklifNo: string | null },
  ben: Kullanici
) {
  const kaynak = `teklif:${t.id}`;
  if (t.durum === "gonderildi") {
    await ac(
      b,
      { kaynak, baslik: `Teklif takibi${t.teklifNo ? ` — ${t.teklifNo}` : ""}`, firmaId: t.firmaId, gun: 7, tarih: t.tarih, teklifId: t.id },
      ben
    );
  } else if (t.durum !== "hazirlaniyor") {
    await kapat(b, kaynak);
  }
}

export async function temasGorevi(b: PoolClient, t: { id: number; firmaId: number; takip: string }, ben: Kullanici) {
  const kaynak = `temas:${t.id}`;
  if (t.takip === "teklif_verilecek") {
    await ac(b, { kaynak, baslik: "Teklif hazırla", firmaId: t.firmaId, gun: 3, temasId: t.id }, ben);
  } else if (t.takip === "teklif_gonderildi" || t.takip === "olumsuz") {
    await kapat(b, kaynak);
  }
}
