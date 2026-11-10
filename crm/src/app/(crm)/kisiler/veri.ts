import { sorgu } from "@/lib/db";

export type KisiSatiri = {
  id: number;
  ad: string;
  unvan: string | null;
  eposta: string | null;
  telefon: string | null;
  firmaId: number;
  firma: string;
  ulke: string | null;
  /** YYYY-MM-DD */
  sonTemas: string | null;
};

/** Bütün firmaların kişileri; ad, e-posta, telefon, firma ya da ülkede arar. Son temas yeniden eskiye. */
export async function kisiListesi(q: string, sinir: number): Promise<KisiSatiri[]> {
  return sorgu<KisiSatiri>(
    `SELECT k.id, k.ad, k.unvan, k.eposta, k.telefon, f.id AS "firmaId", f.ad AS firma, f.ulke,
            (SELECT to_char(max(coalesce(t.son_temas, t.tarih)), 'YYYY-MM-DD') FROM crm_temas t WHERE t.kisi_id = k.id) AS "sonTemas"
       FROM crm_kisi k
       JOIN crm_firma f ON f.id = k.firma_id
      WHERE $1 = '' OR k.ad ILIKE '%' || $1 || '%' OR k.eposta ILIKE '%' || $1 || '%' OR k.eposta2 ILIKE '%' || $1 || '%'
         OR k.telefon ILIKE '%' || $1 || '%' OR f.ad ILIKE '%' || $1 || '%' OR f.ulke ILIKE '%' || $1 || '%'
      ORDER BY "sonTemas" DESC NULLS LAST, lower(k.ad)
      LIMIT $2`,
    [q, sinir],
  );
}
