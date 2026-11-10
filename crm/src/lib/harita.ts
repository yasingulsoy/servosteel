import { sorgu } from "./db";
import { ES_AD, ULKE_KODU } from "./dunya-ulkeleri";
import { sehirBul } from "./sehir-bul";

/**
 * Dünya haritasının verisi: tanıtım e-postası gönderilen firmalar (sitenin
 * panel tabloları) ve CRM firmaları; ülke ülke, şehir şehir, bir de canlı akış.
 *
 * "Ulaşıldı" = hedef_gonderim'de sonucu 'ok' ya da 'belirsiz' olan en az bir
 * gönderim. Durum alanına bakılmıyor; firma sonradan "Elenenler"e taşınsa da
 * mail gitmiş olur.
 *
 * Bir CRM firması panel kaydına bağlıysa ve o kayda mail gittiyse iki kez
 * sayılmaz (firma = eposta + crmEk).
 *
 * Şehir: panelde ayrı alan yok, firmanın açıklamasından bulunuyor
 * (lib/sehir-bul.ts). Bulunamayan firma ülkenin noktasında gösterilir.
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

/* ---- Şehirler ---------------------------------------------------------- */

type Konum = { sehir: string; lat: number; lng: number } | null;
type Konumlar = { zaman: number; panel: Map<number, Konum>; crm: Map<number, Konum> };

/* Şehir bulma bütün firmalarda ~0,5 sn sürüyor; sonuç 10 dakika bellekte. */
let konumOnbellegi: Konumlar | null = null;
let konumSuruyor: Promise<Konumlar> | null = null;
const KONUM_OMRU = 10 * 60_000;

const ulkeKodu = (ulke: string): string | undefined => ULKE_KODU[ES_AD[ulke] ?? ulke];

function konumBul(ulke: string, aciklama: string, ad: string, adresler: string[]): Konum {
  const kod = ulkeKodu(ulke);
  const s = kod ? sehirBul(kod, aciklama, ad, adresler) : null;
  return s ? { sehir: s.ad, lat: s.lat, lng: s.lng } : null;
}

async function konumlar(): Promise<Konumlar> {
  if (konumOnbellegi && Date.now() - konumOnbellegi.zaman < KONUM_OMRU) return konumOnbellegi;
  konumSuruyor ??= (async () => {
    const [h, c] = await Promise.all([
      sorgu<{ id: number; firma: string; ulke: string; urun: string; kanit: string; web: string }>(
        `SELECT id, firma, trim(ulke) AS ulke, urun, kanit, web FROM hedef_firmalar WHERE trim(ulke) <> ''`,
      ),
      sorgu<{ id: number; ad: string; ulke: string; sehir: string | null; faaliyet: string | null; web: string | null }>(
        `SELECT id, ad, trim(ulke) AS ulke, sehir, faaliyet, web FROM crm_firma WHERE coalesce(trim(ulke), '') <> ''`,
      ),
    ]);
    const panel = new Map<number, Konum>();
    for (const f of h) panel.set(f.id, konumBul(f.ulke, f.urun ?? "", f.firma ?? "", [f.kanit ?? "", f.web ?? ""]));
    const crm = new Map<number, Konum>();
    for (const f of c) {
      /* CRM'de şehir yazılmışsa o; yoksa faaliyet metninden. */
      const yazili = f.sehir ? konumBul(f.ulke, `x, ${f.sehir}`, "", []) : null;
      crm.set(f.id, yazili ?? konumBul(f.ulke, f.faaliyet ?? "", f.ad, [f.web ?? ""]));
    }
    konumOnbellegi = { zaman: Date.now(), panel, crm };
    return konumOnbellegi;
  })().finally(() => {
    konumSuruyor = null;
  });
  return konumSuruyor;
}

/** Haritadaki yer: bir şehir ya da (şehri bilinmeyenler için) ülkenin kendisi. */
export type HaritaYeri = {
  ulke: string;
  /** null: bu ülkede şehri bilinmeyen firmalar, ülkenin ortasında gösterilir */
  sehir: string | null;
  lat: number | null;
  lng: number | null;
};

import { DURUM_KODU } from "./harita-sabit";
export { DURUM_KODU };

/**
 * Haritanın firma tablosu. Tarayıcı süzer ve toplar (durum, segment, zaman),
 * sunucu yalnız bir kez gönderir. Satır: [yer, durum, segment maskesi, gün];
 * gün = ilk mailin `baslangic`tan sonraki günü, mail gitmemişse -1.
 */
export type HaritaFirmalari = {
  yerler: HaritaYeri[];
  firmalar: [number, number, number, number][];
  segmentler: string[];
  /** ilk mailin günü (YYYY-MM-DD, İstanbul) */
  baslangic: string;
};

const segmentAyir = (s: string | null) =>
  (s ?? "")
    .split(/\s*[+;,]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);

export async function haritaFirmalari(): Promise<HaritaFirmalari> {
  const [k, panel, crm] = await Promise.all([
    konumlar(),
    sorgu<{ id: number; ulke: string; durum: string; segmentler: string; ilk: string | null; sirada: boolean }>(
      `WITH g AS (
         SELECT firma_id, min(zaman) AS ilk FROM hedef_gonderim
          WHERE sonuc IN ('ok', 'belirsiz') AND firma_id IS NOT NULL GROUP BY firma_id
       )
       SELECT h.id, trim(h.ulke) AS ulke, h.durum, h.segmentler,
              to_char(g.ilk AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS ilk,
              (g.firma_id IS NULL AND h.durum = 'bekliyor' AND h.listede AND h.eposta <> '') AS sirada
         FROM hedef_firmalar h
         LEFT JOIN g ON g.firma_id = h.id
        WHERE trim(h.ulke) <> '' AND (g.firma_id IS NOT NULL OR (h.durum = 'bekliyor' AND h.listede AND h.eposta <> ''))`,
    ),
    sorgu<{ id: number; ulke: string }>(
      `SELECT f.id, trim(f.ulke) AS ulke
         FROM crm_firma f
        WHERE coalesce(trim(f.ulke), '') <> ''
          AND (f.hedef_firma_id IS NULL OR NOT EXISTS (
                SELECT 1 FROM hedef_gonderim g WHERE g.firma_id = f.hedef_firma_id AND g.sonuc IN ('ok', 'belirsiz')))`,
    ),
  ]);

  const yerler: HaritaYeri[] = [];
  const yerNo = new Map<string, number>();
  const yer = (ulke: string, konum: Konum) => {
    const anahtar = `${ulke}|${konum?.sehir ?? ""}`;
    let i = yerNo.get(anahtar);
    if (i === undefined) {
      i = yerler.length;
      yerler.push({ ulke, sehir: konum?.sehir ?? null, lat: konum?.lat ?? null, lng: konum?.lng ?? null });
      yerNo.set(anahtar, i);
    }
    return i;
  };

  /* Segmentler sıklık sırasıyla; maske en çok 30 bit. */
  const sayac = new Map<string, number>();
  for (const f of panel) for (const sg of segmentAyir(f.segmentler)) sayac.set(sg, (sayac.get(sg) ?? 0) + 1);
  const segmentler = [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([ad]) => ad);
  const segBit = new Map(segmentler.map((ad, i) => [ad, 1 << i]));
  const maske = (s: string) => segmentAyir(s).reduce((m, sg) => m | (segBit.get(sg) ?? 0), 0);

  const baslangic = panel.reduce<string | null>((m, f) => (f.ilk && (!m || f.ilk < m) ? f.ilk : m), null) ?? "2026-09-22";
  const t0 = Date.parse(`${baslangic}T00:00:00Z`);
  const gunu = (ilk: string | null) => (ilk ? Math.round((Date.parse(`${ilk}T00:00:00Z`) - t0) / 86_400_000) : -1);

  const firmalar: [number, number, number, number][] = [];
  for (const f of panel) {
    const durum = f.sirada
      ? DURUM_KODU.sirada
      : f.durum === "olumlu"
        ? DURUM_KODU.olumlu
        : f.durum === "yanit" || f.durum === "red"
          ? DURUM_KODU.yanit
          : DURUM_KODU.mail;
    firmalar.push([yer(f.ulke, k.panel.get(f.id) ?? null), durum, maske(f.segmentler), gunu(f.ilk)]);
  }
  for (const f of crm) firmalar.push([yer(f.ulke, k.crm.get(f.id) ?? null), DURUM_KODU.crm, 0, -1]);
  return { yerler, firmalar, segmentler, baslangic };
}

/* ---- Canlı akış --------------------------------------------------------- */

/** Son 24 saatte giden mailler ve son 60 günde gelen yanıtlar; harita bunları sırayla oynatır. */
export type AkisOgesi = {
  tur: "mail" | "hatirlatma" | "yanit";
  /** ISO zaman */
  zaman: string;
  firma: string;
  ulke: string;
  sehir: string | null;
  lat: number | null;
  lng: number | null;
};

/** `son` verilirse yalnız o andan sonrası (haritanın dakikalık yoklaması). */
export async function haritaAkisi(son?: string): Promise<AkisOgesi[]> {
  const sonra = son && !Number.isNaN(Date.parse(son)) ? new Date(son).toISOString() : null;
  const [k, giden, gelen] = await Promise.all([
    konumlar(),
    sorgu<{ id: number; firma: string; ulke: string; zaman: string; tur: number }>(
      `SELECT h.id, h.firma, trim(h.ulke) AS ulke, to_char(g.zaman AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS zaman, g.tur
         FROM hedef_gonderim g
         JOIN hedef_firmalar h ON h.id = g.firma_id
        WHERE g.sonuc IN ('ok', 'belirsiz') AND trim(h.ulke) <> ''
          AND g.zaman > coalesce($1::timestamptz, now() - interval '24 hours')
        ORDER BY g.zaman
        LIMIT 600`,
      [sonra],
    ),
    sorgu<{ id: number; firma: string; ulke: string; zaman: string }>(
      `SELECT h.id, h.firma, trim(h.ulke) AS ulke,
              to_char(coalesce(e.zaman, e.islendi) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS zaman
         FROM gelen_eposta e
         JOIN hedef_firmalar h ON h.id = e.firma_id
        WHERE e.tur = 'yanit' AND trim(h.ulke) <> ''
          AND coalesce(e.zaman, e.islendi) > coalesce($1::timestamptz, now() - interval '60 days')
        ORDER BY coalesce(e.zaman, e.islendi)
        LIMIT 80`,
      [sonra],
    ),
  ]);
  const oge = (f: { id: number; firma: string; ulke: string; zaman: string }, tur: AkisOgesi["tur"]): AkisOgesi => {
    const konum = k.panel.get(f.id) ?? null;
    return {
      tur,
      zaman: f.zaman,
      firma: f.firma,
      ulke: f.ulke,
      sehir: konum?.sehir ?? null,
      lat: konum?.lat ?? null,
      lng: konum?.lng ?? null,
    };
  };
  return [...giden.map((g) => oge(g, g.tur > 1 ? "hatirlatma" : "mail")), ...gelen.map((g) => oge(g, "yanit"))];
}

/* ---- Seçilen ülkenin firmaları ------------------------------------------ */

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
  sehir: string | null;
};

/**
 * Bir ülkede ulaşılan firmalar: önce yanıt verenler, sonra en son mail atılanlar.
 * `sehir`: null → bütün ülke; "" → şehri bilinmeyenler; ad → o şehir.
 */
export async function ulkeFirmalari(ulke: string, sehir: string | null, sinir = 400): Promise<HaritaFirmasi[]> {
  const [k, panel, crm] = await Promise.all([
    konumlar(),
    sorgu<HaritaFirmasi>(
      `SELECT 'eposta' AS kaynak, h.id, h.firma AS ad, h.web, h.durum, h.segmentler AS segment,
              to_char(max(g.zaman) AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS son,
              min(c.id) AS "crmId"
         FROM hedef_firmalar h
         JOIN hedef_gonderim g ON g.firma_id = h.id AND g.sonuc IN ('ok', 'belirsiz')
         LEFT JOIN crm_firma c ON c.hedef_firma_id = h.id
        WHERE trim(h.ulke) = $1
        GROUP BY h.id
        ORDER BY (h.durum = 'olumlu') DESC, (h.durum IN ('yanit', 'red')) DESC, max(g.zaman) DESC`,
      [ulke],
    ),
    sorgu<HaritaFirmasi>(
      `SELECT 'crm' AS kaynak, f.id, f.ad, coalesce(f.web, '') AS web, f.durum, coalesce(f.sektor, '') AS segment,
              NULL AS son, f.id AS "crmId"
         FROM crm_firma f
        WHERE trim(f.ulke) = $1
        ORDER BY (f.durum = 'musteri') DESC, f.ad`,
      [ulke],
    ),
  ]);
  for (const p of panel) p.sehir = k.panel.get(p.id)?.sehir ?? null;
  for (const c of crm) c.sehir = k.crm.get(c.id)?.sehir ?? null;
  /* CRM'e bağlı panel kaydı zaten listede: CRM satırını ikinci kez gösterme. */
  const bagli = new Set(panel.map((p) => p.crmId).filter(Boolean));
  const hepsi = [...crm.filter((c) => !bagli.has(c.id)), ...panel];
  const secilen = sehir === null ? hepsi : hepsi.filter((f) => (f.sehir ?? "") === sehir);
  return secilen.slice(0, sinir);
}
