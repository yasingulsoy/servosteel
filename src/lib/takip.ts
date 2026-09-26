import "server-only";
import { sorguSert } from "@/lib/db";
import type { TakipTuru } from "@/lib/takip-bicim";

/**
 * Takip hatırlatması — talebe ya da hedef firmaya "şu gün tekrar yaz / ara"
 * tarihi ve kısa bir not. Genel bakışta "Takip" listesi, menüde rozet,
 * pazartesi özetinde sayı olarak görünür.
 *
 * Tarih İSTANBUL GÜNÜ (DATE), "bugün" de İstanbul'a göre: sunucu UTC'de
 * çalışsa bile gece 00-03 arası dünün işi "bugün" sanılmaz. Tarih metin
 * ('YYYY-MM-DD') olarak döner — pg DATE'i yerel saat dilimli bir Date'e
 * çeviriyor, sunucu ile tarayıcı arasında gün kayabilirdi.
 *
 * Kendiliğinden konan tek tarih: talep "Teklif gönderildi" olunca, takip
 * yoksa 3 gün sonrası. Talep kazanılır/kaybedilir/spam olursa, firma
 * ilgilenmiyor/abonelikten çıktı/adres hatalı/geçildi olursa takip kalkar.
 */

export type { TakipTuru };

const TABLO: Record<TakipTuru, string> = { talep: "talepler", firma: "hedef_firmalar" };
const BUGUN = `(now() AT TIME ZONE 'Europe/Istanbul')::date`;

/* Kapanmış kayıtların takibi listede ve sayıda görünmez — durum elle değilse
   de (tarama firmayı "Abonelikten çıktı" / "Adres hatalı" yapınca) düşsün. */
export const TALEP_KAPALI = ["kazanildi", "kaybedildi", "spam"];
export const FIRMA_KAPALI = ["red", "iptal", "hatali", "gecildi"];
const TALEP_ACIK = `durum NOT IN ('kazanildi', 'kaybedildi', 'spam')`;
const FIRMA_ACIK = `durum NOT IN ('red', 'iptal', 'hatali', 'gecildi')`;

export type Takip = { tarih: string | null; notu: string; bugun: string };

export async function takipOku(tur: TakipTuru, id: number): Promise<Takip> {
  const r = await sorguSert<Takip>(
    `SELECT to_char(takip, 'YYYY-MM-DD') AS tarih, takip_notu AS notu, to_char(${BUGUN}, 'YYYY-MM-DD') AS bugun
     FROM ${TABLO[tur]} WHERE id = $1`,
    [id]
  );
  return r[0] ?? { tarih: null, notu: "", bugun: "" };
}

export type TakipSecimi = { gun: number } | { tarih: string } | null;

/**
 * Tarihi koyar (bugünden `gun` sonra ya da verilen gün) ya da kaldırır
 * (null). Kayıt yoksa `bulundu: false`.
 */
export async function takipYaz(
  tur: TakipTuru,
  id: number,
  secim: TakipSecimi,
  notu: string
): Promise<{ bulundu: boolean; tarih: string | null }> {
  if (secim === null) {
    const r = await sorguSert(`UPDATE ${TABLO[tur]} SET takip = NULL, takip_notu = '' WHERE id = $1 RETURNING id`, [id]);
    return { bulundu: r.length > 0, tarih: null };
  }
  const gunle = "gun" in secim;
  const r = await sorguSert<{ tarih: string }>(
    `UPDATE ${TABLO[tur]} SET takip = ${gunle ? `${BUGUN} + $2::int` : "$2::date"}, takip_notu = $3
     WHERE id = $1 RETURNING to_char(takip, 'YYYY-MM-DD') AS tarih`,
    [id, gunle ? secim.gun : secim.tarih, notu.slice(0, 300)]
  );
  return { bulundu: r.length > 0, tarih: r[0]?.tarih ?? null };
}

/** Durum değişince: takip YOKSA `gun` gün sonrasına koyar (elle konanı ezmez). */
export async function takipYoksaKoy(tur: TakipTuru, id: number, gun: number, notu: string) {
  await sorguSert(
    `UPDATE ${TABLO[tur]} SET takip = ${BUGUN} + $2::int, takip_notu = $3 WHERE id = $1 AND takip IS NULL`,
    [id, gun, notu]
  );
}

export async function takipKaldir(tur: TakipTuru, id: number) {
  await sorguSert(`UPDATE ${TABLO[tur]} SET takip = NULL, takip_notu = '' WHERE id = $1 AND takip IS NOT NULL`, [id]);
}

export type TakipSatiri = {
  tur: TakipTuru;
  id: number;
  ad: string;
  ulke: string;
  durum: string;
  tarih: string;
  notu: string;
  /** bugünden farkı; eksi = gecikmiş */
  gun: number;
};

/** Takibi gelenler (bugün ve gecikenler) ve önümüzdeki `ileri` gün — en eskisi başta. */
export async function takipListesi(ileri = 7, adet = 40): Promise<{ satirlar: TakipSatiri[]; bugun: string }> {
  const [satirlar, [b]] = await Promise.all([
    sorguSert<TakipSatiri>(
      `SELECT * FROM (
         SELECT 'talep' AS tur, id, COALESCE(NULLIF(firma, ''), NULLIF(ad, ''), eposta) AS ad, ulke, durum,
                to_char(takip, 'YYYY-MM-DD') AS tarih, takip_notu AS notu, (takip - ${BUGUN})::int AS gun
         FROM talepler
         WHERE takip IS NOT NULL AND takip <= ${BUGUN} + $1::int AND ${TALEP_ACIK}
         UNION ALL
         SELECT 'firma', id, firma, ulke, durum,
                to_char(takip, 'YYYY-MM-DD'), takip_notu, (takip - ${BUGUN})::int
         FROM hedef_firmalar
         WHERE takip IS NOT NULL AND takip <= ${BUGUN} + $1::int AND ${FIRMA_ACIK}
       ) t
       ORDER BY tarih, tur, id
       LIMIT $2`,
      [ileri, adet]
    ),
    sorguSert<{ bugun: string }>(`SELECT to_char(${BUGUN}, 'YYYY-MM-DD') AS bugun`),
  ]);
  return { satirlar, bugun: b?.bugun ?? "" };
}

/** Tarihi bugün ya da geçmiş olan takip sayısı — menü rozeti. */
export async function takipSayisi(): Promise<number> {
  const r = await sorguSert<{ adet: number }>(
    `SELECT ((SELECT count(*) FROM talepler WHERE takip <= ${BUGUN} AND ${TALEP_ACIK})
           + (SELECT count(*) FROM hedef_firmalar WHERE takip <= ${BUGUN} AND ${FIRMA_ACIK}))::int AS adet`
  );
  return r[0]?.adet ?? 0;
}
