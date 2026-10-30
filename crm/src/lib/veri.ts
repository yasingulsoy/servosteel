import { sorgu, tek } from "./db";
import type { DOVIZ, ETKINLIK_TURU, FIRMA_DURUMU, KANAL, POTANSIYEL, RED_SEBEBI, TAKIP, TEKLIF_DURUMU } from "./sabitler";

/** Okuma sorguları. Yazmalar ilgili sayfanın actions.ts dosyasında. */

export type Etkinlik = {
  id: number;
  ad: string;
  tur: keyof typeof ETKINLIK_TURU;
  baslangic: string | null;
  bitis: string | null;
  sehir: string | null;
  ulke: string | null;
  yer: string | null;
  aciklama: string | null;
};
export type EtkinlikOzet = Etkinlik & { firma_sayisi: number; kisi_sayisi: number; teklif_sayisi: number };

export type Firma = {
  id: number;
  ad: string;
  ulke: string | null;
  bolge: string | null;
  sehir: string | null;
  web: string | null;
  alan_adi: string | null;
  sektor: string | null;
  faaliyet: string | null;
  potansiyel: keyof typeof POTANSIYEL;
  durum: keyof typeof FIRMA_DURUMU;
  notlar: string | null;
  olusturan: string | null;
  olusturuldu: Date;
  guncellendi: Date;
};

export type Kisi = {
  id: number;
  firma_id: number;
  ad: string;
  unvan: string | null;
  eposta: string | null;
  eposta2: string | null;
  telefon: string | null;
  notlar: string | null;
};

export type Temas = {
  id: number;
  firma_id: number;
  firma_ad: string;
  firma_ulke: string | null;
  potansiyel: keyof typeof POTANSIYEL;
  kisi_id: number | null;
  kisi_ad: string | null;
  kisi_unvan: string | null;
  kisi_eposta: string | null;
  etkinlik_id: number | null;
  etkinlik_ad: string | null;
  tarih: string | null;
  talep: string | null;
  takip: keyof typeof TAKIP;
  kanal: keyof typeof KANAL;
  kaynak: string | null;
  son_temas: string | null;
  notlar: string | null;
  ilgiler: string[];
  olusturan: string | null;
  guncellendi: Date;
};

export type IlgiAlani = { kod: string; ad: string; grup: string };

export async function ilgiAlanlari(): Promise<IlgiAlani[]> {
  return sorgu<IlgiAlani>(`SELECT kod, ad, grup FROM crm_ilgi_alani WHERE aktif ORDER BY sira, ad`);
}

export async function etkinlikler(): Promise<EtkinlikOzet[]> {
  return sorgu<EtkinlikOzet>(`
    SELECT e.*,
           (SELECT count(DISTINCT t.firma_id)::int FROM crm_temas t WHERE t.etkinlik_id = e.id) AS firma_sayisi,
           (SELECT count(DISTINCT t.kisi_id)::int FROM crm_temas t WHERE t.etkinlik_id = e.id) AS kisi_sayisi,
           (SELECT count(*)::int FROM crm_temas t
             WHERE t.etkinlik_id = e.id AND t.takip IN ('teklif_verilecek', 'cizim_bekleniyor')) AS teklif_sayisi
      FROM crm_etkinlik e
     ORDER BY e.baslangic DESC NULLS LAST, e.id DESC`);
}

export async function etkinlik(id: number): Promise<Etkinlik | null> {
  return tek<Etkinlik>(`SELECT * FROM crm_etkinlik WHERE id = $1`, [id]);
}

const TEMAS_SECIM = `
  SELECT t.id, t.firma_id, f.ad AS firma_ad, f.ulke AS firma_ulke, f.potansiyel,
         t.kisi_id, k.ad AS kisi_ad, k.unvan AS kisi_unvan, k.eposta AS kisi_eposta,
         t.etkinlik_id, e.ad AS etkinlik_ad, t.tarih, t.talep, t.takip, t.kanal, t.kaynak, t.son_temas, t.notlar,
         t.olusturan, t.guncellendi,
         COALESCE((SELECT array_agg(i.ad ORDER BY i.sira)
                     FROM crm_firma_ilgi fi JOIN crm_ilgi_alani i ON i.kod = fi.ilgi_kod
                    WHERE fi.firma_id = f.id), '{}') AS ilgiler
    FROM crm_temas t
    JOIN crm_firma f ON f.id = t.firma_id
    LEFT JOIN crm_kisi k ON k.id = t.kisi_id
    LEFT JOIN crm_etkinlik e ON e.id = t.etkinlik_id`;

/* Satışın önce bakacağı sıra: teklif bekleyen en üstte, olumsuz en altta. */
const TAKIP_ONCELIK = `CASE t.takip WHEN 'teklif_verilecek' THEN 0 WHEN 'yeni' THEN 1 WHEN 'cizim_bekleniyor' THEN 2
  WHEN 'teknik_bilgi_istendi' THEN 3 WHEN 'gorusuldu' THEN 4 WHEN 'eposta_gonderildi' THEN 5
  WHEN 'teklif_gonderildi' THEN 6 ELSE 7 END`;

export async function etkinlikTemaslari(etkinlikId: number): Promise<Temas[]> {
  return sorgu<Temas>(`${TEMAS_SECIM} WHERE t.etkinlik_id = $1 ORDER BY ${TAKIP_ONCELIK}, f.ad, t.id`, [etkinlikId]);
}

export async function firmaTemaslari(firmaId: number): Promise<Temas[]> {
  return sorgu<Temas>(`${TEMAS_SECIM} WHERE t.firma_id = $1 ORDER BY t.son_temas DESC NULLS LAST, t.id DESC`, [firmaId]);
}

export async function sonTemaslar(adet = 12): Promise<Temas[]> {
  return sorgu<Temas>(`${TEMAS_SECIM} ORDER BY t.guncellendi DESC LIMIT $1`, [adet]);
}

/** Bekleyen işler: yeni talep, teklif / çizim / teknik bilgi bekleyen temaslar. */
export async function bekleyenTemaslar(): Promise<Temas[]> {
  return sorgu<Temas>(
    `${TEMAS_SECIM}
      WHERE t.takip IN ('yeni', 'teklif_verilecek', 'cizim_bekleniyor', 'teknik_bilgi_istendi')
      ORDER BY ${TAKIP_ONCELIK}, t.son_temas NULLS FIRST, f.ad`
  );
}

export type FirmaSatiri = {
  id: number;
  ad: string;
  ulke: string | null;
  bolge: string | null;
  web: string | null;
  sektor: string | null;
  potansiyel: keyof typeof POTANSIYEL;
  durum: keyof typeof FIRMA_DURUMU;
  kisi_sayisi: number;
  ilgiler: string[];
  etkinlikler: string[];
  takip: keyof typeof TAKIP | null;
  son_temas: string | null;
};

export type FirmaFiltresi = {
  q?: string;
  ulke?: string;
  ilgi?: string;
  potansiyel?: string;
  etkinlik?: number | null;
  takip?: string;
  kanal?: string;
};

export async function firmalar(f: FirmaFiltresi): Promise<FirmaSatiri[]> {
  const kosul: string[] = [];
  const d: unknown[] = [];
  const ekle = (sql: string, v: unknown) => {
    d.push(v);
    kosul.push(sql.replaceAll("$?", `$${d.length}`));
  };
  if (f.q) {
    ekle(
      `(f.ad ILIKE $? OR f.web ILIKE $? OR f.sektor ILIKE $? OR f.faaliyet ILIKE $?
        OR EXISTS (SELECT 1 FROM crm_kisi k WHERE k.firma_id = f.id
                     AND (k.ad ILIKE $? OR k.eposta ILIKE $? OR k.eposta2 ILIKE $? OR k.telefon ILIKE $?)))`,
      `%${f.q}%`
    );
  }
  if (f.ulke) ekle(`f.ulke = $?`, f.ulke);
  if (f.potansiyel) ekle(`f.potansiyel = $?`, f.potansiyel);
  if (f.ilgi) ekle(`EXISTS (SELECT 1 FROM crm_firma_ilgi fi WHERE fi.firma_id = f.id AND fi.ilgi_kod = $?)`, f.ilgi);
  if (f.etkinlik) ekle(`EXISTS (SELECT 1 FROM crm_temas t WHERE t.firma_id = f.id AND t.etkinlik_id = $?)`, f.etkinlik);
  if (f.takip) ekle(`EXISTS (SELECT 1 FROM crm_temas t WHERE t.firma_id = f.id AND t.takip = $?)`, f.takip);
  if (f.kanal) ekle(`EXISTS (SELECT 1 FROM crm_temas t WHERE t.firma_id = f.id AND t.kanal = $?)`, f.kanal);

  return sorgu<FirmaSatiri>(
    `SELECT f.id, f.ad, f.ulke, f.bolge, f.web, f.sektor, f.potansiyel, f.durum,
            (SELECT count(*)::int FROM crm_kisi k WHERE k.firma_id = f.id) AS kisi_sayisi,
            COALESCE((SELECT array_agg(i.ad ORDER BY i.sira)
                        FROM crm_firma_ilgi fi JOIN crm_ilgi_alani i ON i.kod = fi.ilgi_kod
                       WHERE fi.firma_id = f.id), '{}') AS ilgiler,
            COALESCE((SELECT array_agg(DISTINCT e.ad)
                        FROM crm_temas t JOIN crm_etkinlik e ON e.id = t.etkinlik_id
                       WHERE t.firma_id = f.id), '{}') AS etkinlikler,
            son.takip, son.son_temas
       FROM crm_firma f
       LEFT JOIN LATERAL (
         SELECT t.takip, t.son_temas FROM crm_temas t WHERE t.firma_id = f.id
          ORDER BY t.son_temas DESC NULLS LAST, t.guncellendi DESC LIMIT 1
       ) son ON true
      ${kosul.length ? `WHERE ${kosul.join(" AND ")}` : ""}
      ORDER BY f.guncellendi DESC
      LIMIT 500`,
    d
  );
}

export async function firma(id: number): Promise<Firma | null> {
  return tek<Firma>(`SELECT * FROM crm_firma WHERE id = $1`, [id]);
}

export async function firmaKisileri(firmaId: number): Promise<Kisi[]> {
  return sorgu<Kisi>(`SELECT * FROM crm_kisi WHERE firma_id = $1 ORDER BY id`, [firmaId]);
}

export async function firmaIlgiKodlari(firmaId: number): Promise<string[]> {
  return (await sorgu<{ ilgi_kod: string }>(`SELECT ilgi_kod FROM crm_firma_ilgi WHERE firma_id = $1`, [firmaId])).map(
    (r) => r.ilgi_kod
  );
}

export type Not = { id: number; metin: string; yazan: string | null; olusturuldu: Date };

export async function firmaNotlari(firmaId: number): Promise<Not[]> {
  return sorgu<Not>(`SELECT id, metin, yazan, olusturuldu FROM crm_not WHERE firma_id = $1 ORDER BY olusturuldu DESC`, [
    firmaId,
  ]);
}

/** Aynı firma zaten var mı: alan adı ya da ad eşleşmesi. */
export async function benzerFirma(alanAdi: string | null, ad: string): Promise<{ id: number; ad: string } | null> {
  return tek<{ id: number; ad: string }>(
    `SELECT id, ad FROM crm_firma
      WHERE ($1::text IS NOT NULL AND alan_adi = $1) OR lower(ad) = lower($2)
      ORDER BY (alan_adi = $1) DESC NULLS LAST, id LIMIT 1`,
    [alanAdi, ad]
  );
}

/** Filtre kutuları için: kayıtlarda geçen ülkeler ve sektörler. */
export async function kullanilanUlkeler(): Promise<string[]> {
  return (await sorgu<{ ulke: string }>(`SELECT DISTINCT ulke FROM crm_firma WHERE ulke IS NOT NULL ORDER BY ulke`)).map(
    (r) => r.ulke
  );
}

export async function kullanilanSektorler(): Promise<string[]> {
  return (
    await sorgu<{ sektor: string }>(`SELECT DISTINCT sektor FROM crm_firma WHERE sektor IS NOT NULL ORDER BY sektor`)
  ).map((r) => r.sektor);
}

export type PanoSayilari = {
  firma: number;
  kisi: number;
  yeni: number;
  teklif_verilecek: number;
  bilgi_bekleyen: number;
  acik_teklif: number;
};

export async function panoSayilari(): Promise<PanoSayilari> {
  return (await tek<PanoSayilari>(`
    SELECT (SELECT count(*)::int FROM crm_firma) AS firma,
           (SELECT count(*)::int FROM crm_kisi) AS kisi,
           (SELECT count(*)::int FROM crm_temas WHERE takip = 'yeni') AS yeni,
           (SELECT count(*)::int FROM crm_teklif WHERE durum IN ('hazirlaniyor', 'gonderildi')) AS acik_teklif,
           (SELECT count(*)::int FROM crm_temas WHERE takip = 'teklif_verilecek') AS teklif_verilecek,
           (SELECT count(*)::int FROM crm_temas WHERE takip IN ('teknik_bilgi_istendi', 'cizim_bekleniyor')) AS bilgi_bekleyen`))!;
}

export type Teklif = {
  id: number;
  firma_id: number;
  firma_ad: string;
  firma_ulke: string | null;
  temas_id: number | null;
  teklif_no: string | null;
  konu: string | null;
  tarih: string;
  gecerlilik: string | null;
  tutar: string | null;
  doviz: keyof typeof DOVIZ;
  durum: keyof typeof TEKLIF_DURUMU;
  red_sebebi: keyof typeof RED_SEBEBI | null;
  dosya_id: number | null;
  dosya_ad: string | null;
  notlar: string | null;
  olusturan: string | null;
};

const TEKLIF_SECIM = `
  SELECT tk.id, tk.firma_id, f.ad AS firma_ad, f.ulke AS firma_ulke, tk.temas_id, tk.teklif_no, tk.konu,
         tk.tarih, tk.gecerlilik, tk.tutar, tk.doviz, tk.durum, tk.red_sebebi, tk.dosya_id, d.ad AS dosya_ad,
         tk.notlar, tk.olusturan
    FROM crm_teklif tk
    JOIN crm_firma f ON f.id = tk.firma_id
    LEFT JOIN crm_dosya d ON d.id = tk.dosya_id`;

export async function firmaTeklifleri(firmaId: number): Promise<Teklif[]> {
  return sorgu<Teklif>(`${TEKLIF_SECIM} WHERE tk.firma_id = $1 ORDER BY tk.tarih DESC, tk.id DESC`, [firmaId]);
}

export async function teklifler(durum?: string): Promise<Teklif[]> {
  return durum
    ? sorgu<Teklif>(`${TEKLIF_SECIM} WHERE tk.durum = $1 ORDER BY tk.tarih DESC, tk.id DESC`, [durum])
    : sorgu<Teklif>(`${TEKLIF_SECIM} ORDER BY tk.tarih DESC, tk.id DESC LIMIT 500`);
}

/** Durum ve döviz başına teklif sayısı ve tutarı (döviz çevrilmez, ayrı toplanır). */
export async function teklifToplamlari(): Promise<{ durum: keyof typeof TEKLIF_DURUMU; doviz: keyof typeof DOVIZ; adet: number; toplam: string | null }[]> {
  return sorgu(
    `SELECT durum, doviz, count(*)::int AS adet, sum(tutar)::text AS toplam FROM crm_teklif GROUP BY durum, doviz ORDER BY durum, doviz`
  );
}

export type DosyaOzet = { id: number; ad: string; tur: string; boyut: number; yukleyen: string | null; olusturuldu: Date };

export async function firmaDosyalari(firmaId: number): Promise<DosyaOzet[]> {
  return sorgu<DosyaOzet>(
    `SELECT id, ad, tur, boyut, yukleyen, olusturuldu FROM crm_dosya WHERE firma_id = $1 ORDER BY olusturuldu DESC`,
    [firmaId]
  );
}

/** Kanal başına: kaç firma, kaç görüşme, kaçına teklif gitti, kaçı kabul. */
export type KanalSatiri = { kanal: keyof typeof KANAL; firma: number; temas: number; teklif: number; kabul: number };

export async function kanalOzeti(): Promise<KanalSatiri[]> {
  return sorgu<KanalSatiri>(`
    SELECT t.kanal,
           count(DISTINCT t.firma_id)::int AS firma,
           count(DISTINCT t.id)::int AS temas,
           /* Teklif kaydı girilmemiş ama takipte "teklif gönderildi" işaretli olan da sayılır. */
           count(DISTINCT t.firma_id) FILTER (
             WHERE t.takip = 'teklif_gonderildi' OR tk.durum IN ('gonderildi', 'kabul', 'red'))::int AS teklif,
           count(DISTINCT tk.firma_id) FILTER (WHERE tk.durum = 'kabul')::int AS kabul
      FROM crm_temas t
      LEFT JOIN crm_teklif tk ON tk.firma_id = t.firma_id
     GROUP BY t.kanal
     ORDER BY temas DESC`);
}
