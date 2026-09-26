import { sorgu, sorguSert } from "@/lib/db";

/**
 * Talep kaydı + küçük CRM şeması.
 *
 * Üç tablo:
 *   talepler   — formdan gelen ve elle girilen talepler, durumu ve sahibi
 *   talep_not  — her talebin altındaki notlar (kim, ne zaman, ne yazdı)
 *   olaylar    — telefon/e-posta tuşu tıklamaları
 *
 * Şema kod tarafından kuruluyor (`semaKur`). Ayrı bir migration aracı
 * getirmedim: üç tablo için Prisma/Drizzle kurmak, kurulumu basitleştirmek
 * yerine zorlaştırır. `IF NOT EXISTS` ile her açılışta güvenle çalışır.
 */

export const DURUMLAR = [
  "yeni",
  "ulasildi",
  "bilgi_verildi",
  "teklif_gonderildi",
  "kazanildi",
  "kaybedildi",
  /* Spam ayrı bir durum, silinen bir kayıt değil: form ne kadar spam alıyor
     bilmek gerekiyor. İstatistikte gerçek talepten AYRI tutuluyor — 9 talep
     diye raporlanan sayının içinde satıcı listesi pazarlayan mailler vardı. */
  "spam",
] as const;

export type Durum = (typeof DURUMLAR)[number];

export const DURUM_ETIKET: Record<Durum, string> = {
  yeni: "Yeni",
  ulasildi: "Ulaşıldı",
  bilgi_verildi: "Bilgi verildi",
  teklif_gonderildi: "Teklif gönderildi",
  kazanildi: "Kazanıldı",
  kaybedildi: "Kaybedildi",
  spam: "Spam",
};

export type Talep = {
  id: number;
  olusturuldu: string;
  guncellendi: string;
  tur: string;
  dil: string;
  ad: string;
  eposta: string;
  firma: string;
  telefon: string;
  ulke: string;
  mesaj: string;
  sayfa: string;
  kaynak: string;
  durum: Durum;
};

export type Not = {
  id: number;
  talep_id: number;
  olusturuldu: string;
  yazan: string;
  govde: string;
};

/** Tabloları yoksa kurar. Bağlantı yoksa sessizce çıkar. */
export async function semaKur(): Promise<boolean> {
  const r = await sorgu(`
    CREATE TABLE IF NOT EXISTS talepler (
      id            SERIAL PRIMARY KEY,
      olusturuldu   TIMESTAMPTZ NOT NULL DEFAULT now(),
      guncellendi   TIMESTAMPTZ NOT NULL DEFAULT now(),
      tur           TEXT NOT NULL DEFAULT 'contact',
      dil           TEXT NOT NULL DEFAULT 'tr',
      ad            TEXT NOT NULL DEFAULT '',
      eposta        TEXT NOT NULL DEFAULT '',
      firma         TEXT NOT NULL DEFAULT '',
      telefon       TEXT NOT NULL DEFAULT '',
      ulke          TEXT NOT NULL DEFAULT '',
      mesaj         TEXT NOT NULL DEFAULT '',
      sayfa         TEXT NOT NULL DEFAULT '',
      kaynak        TEXT NOT NULL DEFAULT 'form',
      durum         TEXT NOT NULL DEFAULT 'yeni'
    );
    CREATE INDEX IF NOT EXISTS talepler_olusturuldu_idx ON talepler (olusturuldu DESC);
    CREATE INDEX IF NOT EXISTS talepler_durum_idx ON talepler (durum);

    CREATE TABLE IF NOT EXISTS talep_not (
      id           SERIAL PRIMARY KEY,
      talep_id     INTEGER NOT NULL REFERENCES talepler(id) ON DELETE CASCADE,
      olusturuldu  TIMESTAMPTZ NOT NULL DEFAULT now(),
      yazan        TEXT NOT NULL DEFAULT '',
      govde        TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS talep_not_talep_idx ON talep_not (talep_id, olusturuldu DESC);

    CREATE TABLE IF NOT EXISTS olaylar (
      id           SERIAL PRIMARY KEY,
      olusturuldu  TIMESTAMPTZ NOT NULL DEFAULT now(),
      tur          TEXT NOT NULL,
      yol          TEXT NOT NULL DEFAULT '',
      dil          TEXT NOT NULL DEFAULT '',
      ulke         TEXT NOT NULL DEFAULT '',
      /* 'beacon' = siteden canli geldi · 'ga4' = GA4'ten aktarildi.
         Beacon 2026-09-15'te yayina girdi; oncesindeki tiklamalar yalnizca
         GA4'te vardi ve panelde 1/1 gorunuyordu. O tarihten ONCESI GA4'ten
         aktarildi, SONRASI beacon'dan geliyor — sinir tek, cift sayim yok. */
      kaynak       TEXT NOT NULL DEFAULT 'beacon'
    );
    ALTER TABLE olaylar ADD COLUMN IF NOT EXISTS kaynak TEXT NOT NULL DEFAULT 'beacon';
    CREATE INDEX IF NOT EXISTS olaylar_olusturuldu_idx ON olaylar (olusturuldu DESC);
    CREATE INDEX IF NOT EXISTS olaylar_tur_idx ON olaylar (tur);
  `);
  return r !== null;
}

/* ---------------------------------------------------------------- yazma */

/** Formdan gelen talebi kaydeder. Hata fırlatmaz — mail akışını bozamaz. */
export async function talepEkle(t: {
  tur: string;
  dil: string;
  ad: string;
  eposta: string;
  firma: string;
  telefon: string;
  ulke?: string;
  mesaj: string;
  sayfa?: string;
  kaynak?: string;
}): Promise<number | null> {
  const r = await sorgu<{ id: number }>(
    `INSERT INTO talepler (tur, dil, ad, eposta, firma, telefon, ulke, mesaj, sayfa, kaynak)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [t.tur, t.dil, t.ad, t.eposta, t.firma, t.telefon, t.ulke ?? "",
     t.mesaj, t.sayfa ?? "", t.kaynak ?? "form"]
  );
  return r?.[0]?.id ?? null;
}

export async function olayEkle(tur: string, yol: string, dil: string, ulke = "", kaynak = "") {
  await sorgu(
    `INSERT INTO olaylar (tur, yol, dil, ulke, kaynak) VALUES ($1,$2,$3,$4,$5)`,
    [tur.slice(0, 40), yol.slice(0, 300), dil.slice(0, 8), ulke.slice(0, 80), kaynak.slice(0, 120)]
  );
}

/* ---------------------------------------------------------------- okuma */

export async function talepler(filtre?: { durum?: string; ara?: string }) {
  const kosul: string[] = [];
  const deger: unknown[] = [];
  if (filtre?.durum && DURUMLAR.includes(filtre.durum as Durum)) {
    deger.push(filtre.durum);
    kosul.push(`durum = $${deger.length}`);
  }
  if (filtre?.ara) {
    deger.push(`%${filtre.ara.toLowerCase()}%`);
    const i = deger.length;
    kosul.push(
      `(lower(ad) LIKE $${i} OR lower(eposta) LIKE $${i} OR lower(firma) LIKE $${i} OR lower(mesaj) LIKE $${i})`
    );
  }
  const nerede = kosul.length ? `WHERE ${kosul.join(" AND ")}` : "";
  return sorguSert<Talep>(
    `SELECT * FROM talepler ${nerede} ORDER BY olusturuldu DESC LIMIT 500`,
    deger
  );
}

export async function talep(id: number) {
  const r = await sorguSert<Talep>(`SELECT * FROM talepler WHERE id = $1`, [id]);
  return r[0] ?? null;
}

export async function notlar(talepId: number) {
  return sorguSert<Not>(
    `SELECT * FROM talep_not WHERE talep_id = $1 ORDER BY olusturuldu DESC`,
    [talepId]
  );
}

export async function durumSayilari() {
  return sorguSert<{ durum: string; adet: string }>(
    `SELECT durum, count(*)::text AS adet FROM talepler GROUP BY durum`
  );
}

/**
 * Talep ve site iletişim sayıları — TÜM ZAMANLAR, son 30 gün ve bugün.
 * İletişim: sitede telefon ya da e-posta bağlantısına tıklama (bkz. api/olay).
 */
export type TalepOzeti = {
  toplam: number;
  bugun: number;
  son30: number;
  yeni: number;
  iletisim: number;
  iletisim30: number;
};

export async function talepOzeti(): Promise<TalepOzeti> {
  const r = await sorguSert<TalepOzeti>(
    `WITH b AS (SELECT date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul' AS gun)
     SELECT
       (SELECT count(*) FROM talepler)::int AS toplam,
       (SELECT count(*) FROM talepler, b WHERE olusturuldu >= b.gun)::int AS bugun,
       (SELECT count(*) FROM talepler WHERE olusturuldu > now() - interval '30 days')::int AS son30,
       (SELECT count(*) FROM talepler WHERE durum = 'yeni')::int AS yeni,
       (SELECT count(*) FROM olaylar WHERE tur IN ('telefon', 'eposta'))::int AS iletisim,
       (SELECT count(*) FROM olaylar WHERE tur IN ('telefon', 'eposta') AND olusturuldu > now() - interval '30 days')::int AS iletisim30`
  );
  return r[0];
}

export async function olaySayilari(gun = 30) {
  return sorguSert<{ tur: string; adet: string }>(
    `SELECT tur, count(*)::text AS adet FROM olaylar
     WHERE olusturuldu > now() - ($1 || ' days')::interval
     GROUP BY tur ORDER BY count(*) DESC`,
    [String(gun)]
  );
}

/* --------------------------------------------------------------- güncelle */

export async function durumDegistir(id: number, durum: Durum) {
  await sorguSert(
    `UPDATE talepler SET durum = $1, guncellendi = now() WHERE id = $2`,
    [durum, id]
  );
}

export async function notEkle(talepId: number, govde: string, yazan: string) {
  await sorguSert(
    `INSERT INTO talep_not (talep_id, govde, yazan) VALUES ($1,$2,$3)`,
    [talepId, govde.slice(0, 4000), yazan.slice(0, 80)]
  );
  await sorguSert(`UPDATE talepler SET guncellendi = now() WHERE id = $1`, [talepId]);
}

export async function talepSil(id: number) {
  await sorguSert(`DELETE FROM talepler WHERE id = $1`, [id]);
}
