import { sorgu } from "./db";

/**
 * Dünya haritasının verisi: tanıtım e-postası gönderilen firmalar (sitenin
 * panel tabloları) ve CRM firmaları, ülke ülke.
 *
 * "Ulaşıldı" = hedef_gonderim'de sonucu 'ok' ya da 'belirsiz' olan en az bir
 * gönderim. Durum alanına bakılmıyor; firma sonradan "Elenenler"e taşınsa da
 * mail gitmiş olur.
 *
 * Bir CRM firması panel kaydına bağlıysa ve o kayda mail gittiyse iki kez
 * sayılmaz (firma = eposta + crmEk).
 */

export type HaritaUlkesi = {
  ulke: string;
  /** haritada işaretlenen sayı: mail giden + mail gitmemiş CRM firmaları */
  firma: number;
  eposta: number;
  yanit: number;
  olumlu: number;
  /** listede, e-postası olan, henüz gönderilmemiş */
  sirada: number;
  crm: number;
  musteri: number;
  /** ilk / son mail (YYYY-MM-DD) */
  ilk: string | null;
  son: string | null;
};

export async function haritaUlkeleri(): Promise<HaritaUlkesi[]> {
  const [panel, crm] = await Promise.all([
    sorgu<{ ulke: string; eposta: number; yanit: number; olumlu: number; sirada: number; ilk: string | null; son: string | null }>(
      `WITH g AS (
         SELECT firma_id, min(zaman) AS ilk, max(zaman) AS son
           FROM hedef_gonderim
          WHERE sonuc IN ('ok', 'belirsiz') AND firma_id IS NOT NULL
          GROUP BY firma_id
       )
       SELECT trim(h.ulke) AS ulke,
              count(g.firma_id)::int AS eposta,
              count(g.firma_id) FILTER (WHERE h.durum IN ('yanit', 'olumlu', 'red'))::int AS yanit,
              count(*) FILTER (WHERE h.durum = 'olumlu')::int AS olumlu,
              count(*) FILTER (WHERE g.firma_id IS NULL AND h.durum = 'bekliyor' AND h.listede AND h.eposta <> '')::int AS sirada,
              to_char(min(g.ilk) AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS ilk,
              to_char(max(g.son) AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS son
         FROM hedef_firmalar h
         LEFT JOIN g ON g.firma_id = h.id
        WHERE trim(h.ulke) <> ''
        GROUP BY trim(h.ulke)`,
    ),
    sorgu<{ ulke: string; crm: number; musteri: number; crm_ek: number }>(
      `SELECT trim(f.ulke) AS ulke,
              count(*)::int AS crm,
              count(*) FILTER (WHERE f.durum = 'musteri')::int AS musteri,
              count(*) FILTER (WHERE f.hedef_firma_id IS NULL OR NOT EXISTS (
                SELECT 1 FROM hedef_gonderim g WHERE g.firma_id = f.hedef_firma_id AND g.sonuc IN ('ok', 'belirsiz')
              ))::int AS crm_ek
         FROM crm_firma f
        WHERE coalesce(trim(f.ulke), '') <> ''
        GROUP BY trim(f.ulke)`,
    ),
  ]);

  const harita = new Map<string, HaritaUlkesi>();
  const al = (ulke: string) => {
    let u = harita.get(ulke);
    if (!u) {
      u = { ulke, firma: 0, eposta: 0, yanit: 0, olumlu: 0, sirada: 0, crm: 0, musteri: 0, ilk: null, son: null };
      harita.set(ulke, u);
    }
    return u;
  };
  for (const p of panel) {
    const u = al(p.ulke.trim());
    u.eposta += p.eposta;
    u.yanit += p.yanit;
    u.olumlu += p.olumlu;
    u.sirada += p.sirada;
    u.firma += p.eposta;
    u.ilk = p.ilk;
    u.son = p.son;
  }
  for (const c of crm) {
    const u = al(c.ulke);
    u.crm += c.crm;
    u.musteri += c.musteri;
    u.firma += c.crm_ek;
  }
  return [...harita.values()].filter((u) => u.firma > 0 || u.sirada > 0).sort((a, b) => b.firma - a.firma);
}

export type HaritaFirmasi = {
  kaynak: "eposta" | "crm";
  id: number;
  ad: string;
  web: string;
  durum: string;
  segment: string;
  /** son mail günü (YYYY-MM-DD), yalnız e-posta kaynağında */
  son: string | null;
  crmId: number | null;
};

/** Bir ülkede ulaşılan firmalar: önce yanıt verenler, sonra en son mail atılanlar. */
export async function ulkeFirmalari(ulke: string, sinir = 400): Promise<HaritaFirmasi[]> {
  const [panel, crm] = await Promise.all([
    sorgu<HaritaFirmasi>(
      `SELECT 'eposta' AS kaynak, h.id, h.firma AS ad, h.web, h.durum, h.segmentler AS segment,
              to_char(max(g.zaman) AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS son,
              min(c.id) AS "crmId"
         FROM hedef_firmalar h
         JOIN hedef_gonderim g ON g.firma_id = h.id AND g.sonuc IN ('ok', 'belirsiz')
         LEFT JOIN crm_firma c ON c.hedef_firma_id = h.id
        WHERE trim(h.ulke) = $1
        GROUP BY h.id
        ORDER BY (h.durum = 'olumlu') DESC, (h.durum IN ('yanit', 'red')) DESC, max(g.zaman) DESC
        LIMIT $2`,
      [ulke, sinir],
    ),
    sorgu<HaritaFirmasi>(
      `SELECT 'crm' AS kaynak, f.id, f.ad, coalesce(f.web, '') AS web, f.durum, coalesce(f.sektor, '') AS segment,
              NULL AS son, f.id AS "crmId"
         FROM crm_firma f
        WHERE trim(f.ulke) = $1
        ORDER BY (f.durum = 'musteri') DESC, f.ad
        LIMIT $2`,
      [ulke, sinir],
    ),
  ]);
  /* CRM'e bağlı panel kaydı zaten listede: CRM satırını ikinci kez gösterme. */
  const bagli = new Set(panel.map((p) => p.crmId).filter(Boolean));
  return [...crm.filter((c) => !bagli.has(c.id)), ...panel];
}
