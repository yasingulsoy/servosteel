import { sorgu, tek } from "./db";
import { KANAL as KANAL_ADI } from "./sabitler";
import type {
  DOVIZ,
  ETKINLIK_TURU,
  FIRMA_DURUMU,
  KANAL,
  POTANSIYEL,
  RED_SEBEBI,
  SERVIS_DURUMU,
  SERVIS_TURU,
  SIPARIS_DURUMU,
  TAKIP,
  TEKLIF_DURUMU,
} from "./sabitler";

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
  sorumlu: string | null;
  hedef_firma_id: number | null;
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

/** Liste ekranı 500 satırla sınırlı; Excel'e aktarma sınırsız ister. */
export async function firmalar(f: FirmaFiltresi, sinir = 500): Promise<FirmaSatiri[]> {
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
      LIMIT ${Math.max(1, Math.floor(sinir))}`,
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

/* ------------------------------------------------------------- kullanıcılar */

/** Atama listeleri için etkin kullanıcılar. */
export async function kullanicilar(): Promise<{ kullanici: string; ad: string }[]> {
  return sorgu(`SELECT kullanici, ad FROM crm_kullanici WHERE aktif ORDER BY ad, kullanici`);
}

/* ------------------------------------------------------------------ görevler */

export type Gorev = {
  id: number;
  baslik: string;
  aciklama: string | null;
  firma_id: number | null;
  firma_ad: string | null;
  teklif_id: number | null;
  atanan: string | null;
  son_tarih: string | null;
  durum: "acik" | "tamam" | "iptal";
  kaynak: string | null;
  tamamlayan: string | null;
  tamamlandi: Date | null;
  olusturan: string | null;
  gecikti: boolean;
};

const GOREV_SECIM = `
  SELECT g.id, g.baslik, g.aciklama, g.firma_id, f.ad AS firma_ad, g.teklif_id, g.atanan, g.son_tarih, g.durum,
         g.kaynak, g.tamamlayan, g.tamamlandi, g.olusturan,
         (g.durum = 'acik' AND g.son_tarih < (now() AT TIME ZONE 'Europe/Istanbul')::date) AS gecikti
    FROM crm_gorev g LEFT JOIN crm_firma f ON f.id = g.firma_id`;

export type GorevFiltresi = { atanan?: string; durum?: "acik" | "tamam"; gecikmis?: boolean };

export async function gorevler(f: GorevFiltresi): Promise<Gorev[]> {
  const kosul: string[] = [];
  const d: unknown[] = [];
  if (f.atanan) {
    d.push(f.atanan);
    kosul.push(`g.atanan = $${d.length}`);
  }
  kosul.push(f.durum === "tamam" ? `g.durum = 'tamam'` : `g.durum = 'acik'`);
  if (f.gecikmis) kosul.push(`g.son_tarih < (now() AT TIME ZONE 'Europe/Istanbul')::date`);
  return sorgu<Gorev>(
    `${GOREV_SECIM} WHERE ${kosul.join(" AND ")}
      ORDER BY ${f.durum === "tamam" ? "g.tamamlandi DESC" : "g.son_tarih NULLS LAST, g.id"} LIMIT 300`,
    d
  );
}

export async function firmaGorevleri(firmaId: number): Promise<Gorev[]> {
  return sorgu<Gorev>(
    `${GOREV_SECIM} WHERE g.firma_id = $1 ORDER BY (g.durum = 'acik') DESC, g.son_tarih NULLS LAST, g.id DESC`,
    [firmaId]
  );
}

/** Pano: yarına kadar vadesi gelen açık görevler (kişiye atanmış ya da sahipsiz). */
export async function vadesiGelenGorevler(kullanici: string): Promise<Gorev[]> {
  return sorgu<Gorev>(
    `${GOREV_SECIM}
      WHERE g.durum = 'acik' AND (g.atanan = $1 OR g.atanan IS NULL)
        AND (g.son_tarih IS NULL OR g.son_tarih <= (now() AT TIME ZONE 'Europe/Istanbul')::date + 1)
      ORDER BY g.son_tarih NULLS LAST LIMIT 30`,
    [kullanici]
  );
}

/* ------------------------------------------------------------- satış sonrası */

export type Siparis = {
  id: number;
  firma_id: number;
  teklif_id: number | null;
  siparis_no: string | null;
  konu: string | null;
  tarih: string;
  tutar: string | null;
  doviz: keyof typeof DOVIZ;
  teslim_tarihi: string | null;
  durum: keyof typeof SIPARIS_DURUMU;
  notlar: string | null;
};

export async function firmaSiparisleri(firmaId: number): Promise<Siparis[]> {
  return sorgu<Siparis>(`SELECT * FROM crm_siparis WHERE firma_id = $1 ORDER BY tarih DESC, id DESC`, [firmaId]);
}

export type Makine = {
  id: number;
  firma_id: number;
  siparis_id: number | null;
  ad: string;
  seri_no: string | null;
  kurulum_tarihi: string | null;
  garanti_bitis: string | null;
  notlar: string | null;
  garantide: boolean;
};

export async function firmaMakineleri(firmaId: number): Promise<Makine[]> {
  return sorgu<Makine>(
    `SELECT *, (garanti_bitis IS NOT NULL AND garanti_bitis >= (now() AT TIME ZONE 'Europe/Istanbul')::date) AS garantide
       FROM crm_makine WHERE firma_id = $1 ORDER BY kurulum_tarihi DESC NULLS LAST, id DESC`,
    [firmaId]
  );
}

export type Servis = {
  id: number;
  firma_id: number;
  firma_ad: string;
  firma_ulke: string | null;
  makine_id: number | null;
  makine_ad: string | null;
  seri_no: string | null;
  tur: keyof typeof SERVIS_TURU;
  aciklama: string;
  durum: keyof typeof SERVIS_DURUMU;
  atanan: string | null;
  acildi: string;
  kapandi: string | null;
  sonuc: string | null;
  garantide: boolean | null;
};

const SERVIS_SECIM = `
  SELECT s.id, s.firma_id, f.ad AS firma_ad, f.ulke AS firma_ulke, s.makine_id, m.ad AS makine_ad, m.seri_no,
         s.tur, s.aciklama, s.durum, s.atanan, s.acildi, s.kapandi, s.sonuc,
         (m.garanti_bitis IS NOT NULL AND m.garanti_bitis >= s.acildi) AS garantide
    FROM crm_servis s JOIN crm_firma f ON f.id = s.firma_id LEFT JOIN crm_makine m ON m.id = s.makine_id`;

export async function firmaServisleri(firmaId: number): Promise<Servis[]> {
  return sorgu<Servis>(`${SERVIS_SECIM} WHERE s.firma_id = $1 ORDER BY (s.durum <> 'kapandi') DESC, s.acildi DESC`, [
    firmaId,
  ]);
}

export async function servisler(acik: boolean): Promise<Servis[]> {
  return sorgu<Servis>(
    `${SERVIS_SECIM} WHERE ${acik ? "s.durum <> 'kapandi'" : "s.durum = 'kapandi'"}
      ORDER BY ${acik ? "s.acildi" : "s.kapandi DESC"} LIMIT 300`
  );
}

/* ------------------------------------------------------------ zaman çizelgesi */

export type CizelgeOgesi = { zaman: string; tur: string; baslik: string; ayrinti: string | null; kim: string | null };

/**
 * Firmanın tek zaman çizelgesi: CRM kayıtları + panelin kayıtları (tanıtım
 * mailleri, gelen yanıtlar, tanıtım mailinden siteye gelişler, panel notları).
 * Panel verisi kopyalanmaz, kaynağından okunur; panel tabloları yoksa yalnız
 * CRM kısmı gelir.
 */
export async function zamanCizelgesi(f: Pick<Firma, "id" | "hedef_firma_id">): Promise<CizelgeOgesi[]> {
  const crm = sorgu<CizelgeOgesi>(
    `SELECT * FROM (
       SELECT t.olusturuldu::text AS zaman, 'gorusme' AS tur,
              'Görüşme · ' || COALESCE(e.ad, t.kanal) AS baslik, t.talep AS ayrinti, t.olusturan AS kim
         FROM crm_temas t LEFT JOIN crm_etkinlik e ON e.id = t.etkinlik_id WHERE t.firma_id = $1
       UNION ALL
       SELECT n.olusturuldu::text, 'not', 'Not', n.metin, n.yazan FROM crm_not n WHERE n.firma_id = $1
       UNION ALL
       SELECT tk.olusturuldu::text, 'teklif', concat_ws(' ', 'Teklif', tk.teklif_no), tk.konu, tk.olusturan
         FROM crm_teklif tk WHERE tk.firma_id = $1
       UNION ALL
       SELECT g.tamamlandi::text, 'gorev', 'Görev tamamlandı: ' || g.baslik, NULL, g.tamamlayan
         FROM crm_gorev g WHERE g.firma_id = $1 AND g.durum = 'tamam' AND g.tamamlandi IS NOT NULL
       UNION ALL
       SELECT s.olusturuldu::text, 'siparis', concat_ws(' ', 'Sipariş', s.siparis_no), s.konu, s.olusturan
         FROM crm_siparis s WHERE s.firma_id = $1
       UNION ALL
       SELECT sv.olusturuldu::text, 'servis', 'Servis talebi', sv.aciklama, sv.olusturan
         FROM crm_servis sv WHERE sv.firma_id = $1
     ) x`,
    [f.id]
  );
  const panel = f.hedef_firma_id
    ? sorgu<CizelgeOgesi>(
        `SELECT * FROM (
           SELECT g.zaman::text AS zaman, 'tanitim' AS tur,
                  CASE WHEN g.tur = 2 THEN 'Hatırlatma maili gitti' ELSE 'Tanıtım maili gitti' END AS baslik,
                  g.konu AS ayrinti, g.gonderen AS kim
             FROM hedef_gonderim g WHERE g.firma_id = $1 AND g.sonuc IN ('ok', 'belirsiz')
           UNION ALL
           SELECT e.zaman::text, 'gelen',
                  CASE e.tur WHEN 'yanit' THEN 'Yanıt geldi' WHEN 'otomatik' THEN 'Otomatik yanıt'
                             WHEN 'geri_donus' THEN 'Mail ulaşmadı' ELSE 'Gelen mail' END,
                  concat_ws(' — ', e.konu, e.ozet), e.kimden
             FROM gelen_eposta e WHERE e.firma_id = $1 AND e.tur IN ('yanit', 'otomatik', 'geri_donus')
           UNION ALL
           SELECT o.olusturuldu::text, 'ziyaret', 'Tanıtım mailinden siteye geldi', o.yol, NULL
             FROM olaylar o JOIN hedef_firmalar h ON h.id = $1
            WHERE o.tur = 'outreach' AND o.kaynak = split_part(h.anahtar, '|', 1) AND o.etkilesim
           UNION ALL
           SELECT n.olusturuldu::text, 'panel_not', 'Panel notu', n.govde, n.yazan
             FROM hedef_not n WHERE n.firma_id = $1
         ) x`,
        [f.hedef_firma_id]
      ).catch(() => [] as CizelgeOgesi[])
    : Promise.resolve([] as CizelgeOgesi[]);
  /* Etkinliksiz görüşmenin başlığında kanal kodu var ("telefon"); ekranda adı yazsın. */
  const crmOgeleri = (await crm).map((o) =>
    o.tur === "gorusme" ? { ...o, baslik: o.baslik.replace(/· (\w+)$/, (_, k: string) => `· ${KANAL_ADI[k as keyof typeof KANAL_ADI] ?? k}`) } : o
  );
  const tum = [...crmOgeleri, ...(await panel)];
  return tum.sort((a, b) => (new Date(a.zaman) < new Date(b.zaman) ? 1 : -1)).slice(0, 200);
}

/* ------------------------------------------------------------------- arama */

export type AramaSonucu = {
  tur: "firma" | "kisi" | "teklif" | "makine";
  firma_id: number;
  baslik: string;
  ayrinti: string | null;
};

export async function ara(q: string): Promise<AramaSonucu[]> {
  const k = `%${q}%`;
  return sorgu<AramaSonucu>(
    `(SELECT 'firma' AS tur, f.id AS firma_id, f.ad AS baslik, concat_ws(' · ', f.ulke, f.web) AS ayrinti
        FROM crm_firma f WHERE f.ad ILIKE $1 OR f.web ILIKE $1 OR f.alan_adi ILIKE $1 LIMIT 30)
     UNION ALL
     (SELECT 'kisi', k.firma_id, k.ad, concat_ws(' · ', f.ad, k.unvan, k.eposta, k.telefon)
        FROM crm_kisi k JOIN crm_firma f ON f.id = k.firma_id
       WHERE k.ad ILIKE $1 OR k.eposta ILIKE $1 OR k.eposta2 ILIKE $1 OR k.telefon ILIKE $1 LIMIT 30)
     UNION ALL
     (SELECT 'teklif', t.firma_id, COALESCE(t.teklif_no, 'Teklif'), concat_ws(' · ', f.ad, t.konu)
        FROM crm_teklif t JOIN crm_firma f ON f.id = t.firma_id
       WHERE t.teklif_no ILIKE $1 OR t.konu ILIKE $1 LIMIT 20)
     UNION ALL
     (SELECT 'makine', m.firma_id, m.ad, concat_ws(' · ', f.ad, m.seri_no)
        FROM crm_makine m JOIN crm_firma f ON f.id = m.firma_id
       WHERE m.ad ILIKE $1 OR m.seri_no ILIKE $1 LIMIT 20)`,
    [k]
  );
}

/* ----------------------------------------------------------------- raporlar */

export type HuniSatiri = { adim: string; firma: number };

/** Huni: görüşülen firma → teklif istenen → teklif giden → kabul → sipariş. */
export async function huni(): Promise<HuniSatiri[]> {
  return sorgu<HuniSatiri>(`
    SELECT 'Görüşülen firma' AS adim, count(DISTINCT firma_id)::int AS firma FROM crm_temas
    UNION ALL
    SELECT 'Teklif istenen', count(DISTINCT firma_id)::int FROM (
      SELECT firma_id FROM crm_temas WHERE takip IN ('teklif_verilecek', 'cizim_bekleniyor', 'teklif_gonderildi')
      UNION SELECT firma_id FROM crm_teklif) x
    UNION ALL
    SELECT 'Teklif giden', count(DISTINCT firma_id)::int FROM (
      SELECT firma_id FROM crm_teklif WHERE durum IN ('gonderildi', 'kabul', 'red')
      UNION SELECT firma_id FROM crm_temas WHERE takip = 'teklif_gonderildi') x
    UNION ALL
    SELECT 'Kabul', count(DISTINCT firma_id)::int FROM crm_teklif WHERE durum = 'kabul'
    UNION ALL
    SELECT 'Sipariş', count(DISTINCT firma_id)::int FROM crm_siparis WHERE durum <> 'iptal'`);
}

export type KirilimSatiri = { anahtar: string; firma: number; teklif: number; kabul: number };

/** Ülke, ilgi alanı ya da kanal başına: firma, teklif giden firma, kabul. */
export async function kirilim(boyut: "ulke" | "ilgi" | "kanal"): Promise<KirilimSatiri[]> {
  const kaynak = {
    ulke: `SELECT f.id AS firma_id, COALESCE(f.ulke, 'Ülke yok') AS anahtar FROM crm_firma f`,
    ilgi: `SELECT fi.firma_id, i.ad AS anahtar FROM crm_firma_ilgi fi JOIN crm_ilgi_alani i ON i.kod = fi.ilgi_kod`,
    kanal: `SELECT DISTINCT firma_id, kanal AS anahtar FROM crm_temas`,
  }[boyut];
  return sorgu<KirilimSatiri>(`
    WITH k AS (${kaynak}),
         teklifli AS (SELECT firma_id FROM crm_teklif WHERE durum IN ('gonderildi', 'kabul', 'red')
                      UNION SELECT firma_id FROM crm_temas WHERE takip = 'teklif_gonderildi'),
         kabullu AS (SELECT firma_id FROM crm_teklif WHERE durum = 'kabul')
    SELECT k.anahtar, count(DISTINCT k.firma_id)::int AS firma,
           count(DISTINCT k.firma_id) FILTER (WHERE k.firma_id IN (SELECT firma_id FROM teklifli))::int AS teklif,
           count(DISTINCT k.firma_id) FILTER (WHERE k.firma_id IN (SELECT firma_id FROM kabullu))::int AS kabul
      FROM k GROUP BY k.anahtar ORDER BY firma DESC, k.anahtar LIMIT 40`);
}

export async function redSebepleri(): Promise<{ sebep: keyof typeof RED_SEBEBI; adet: number }[]> {
  return sorgu(
    `SELECT red_sebebi AS sebep, count(*)::int AS adet FROM crm_teklif
      WHERE durum = 'red' AND red_sebebi IS NOT NULL GROUP BY 1 ORDER BY adet DESC`
  );
}

export type TeklifHizi = { ort_gun: number | null; teklif: number; sonuclanan: number; kabul: number };

/** İlk görüşmeden ilk teklife ortalama gün; teklif ve sonuç sayıları. */
export async function teklifHizi(): Promise<TeklifHizi> {
  return (await tek<TeklifHizi>(`
    WITH ilk AS (SELECT firma_id, min(COALESCE(tarih, olusturuldu::date)) AS ilk FROM crm_temas GROUP BY firma_id),
         ilkteklif AS (SELECT firma_id, min(tarih) AS teklif FROM crm_teklif GROUP BY firma_id)
    SELECT (SELECT round(avg(t.teklif - i.ilk))::int FROM ilkteklif t JOIN ilk i ON i.firma_id = t.firma_id
             WHERE t.teklif >= i.ilk) AS ort_gun,
           (SELECT count(*)::int FROM crm_teklif WHERE durum <> 'iptal') AS teklif,
           (SELECT count(*)::int FROM crm_teklif WHERE durum IN ('kabul', 'red')) AS sonuclanan,
           (SELECT count(*)::int FROM crm_teklif WHERE durum = 'kabul') AS kabul`))!;
}

export type SorumluSatiri = { kim: string; firma: number; gorev: number; geciken: number; teklif: number };

/** Sorumlu başına açık iş. */
export async function sorumluYuku(): Promise<SorumluSatiri[]> {
  return sorgu<SorumluSatiri>(`
    WITH kisiler AS (SELECT sorumlu AS kim FROM crm_firma WHERE sorumlu IS NOT NULL
                     UNION SELECT atanan FROM crm_gorev WHERE atanan IS NOT NULL)
    SELECT k.kim,
           (SELECT count(*)::int FROM crm_firma f WHERE f.sorumlu = k.kim) AS firma,
           (SELECT count(*)::int FROM crm_gorev g WHERE g.atanan = k.kim AND g.durum = 'acik') AS gorev,
           (SELECT count(*)::int FROM crm_gorev g WHERE g.atanan = k.kim AND g.durum = 'acik'
               AND g.son_tarih < (now() AT TIME ZONE 'Europe/Istanbul')::date) AS geciken,
           (SELECT count(*)::int FROM crm_teklif t JOIN crm_firma f ON f.id = t.firma_id
             WHERE f.sorumlu = k.kim AND t.durum IN ('hazirlaniyor', 'gonderildi')) AS teklif
      FROM kisiler k ORDER BY gorev DESC, k.kim`);
}
