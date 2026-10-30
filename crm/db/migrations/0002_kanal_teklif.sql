-- Kanal (temas nereden geldi), panelden aktarılan kaydın kaynağı, teklifler ve dosyalar.

-- "Yeni talep": satışa düşmüş ama henüz kimsenin dönmediği kayıt (panelden gelenler).
ALTER TABLE crm_temas DROP CONSTRAINT crm_temas_takip_check;
ALTER TABLE crm_temas ADD CONSTRAINT crm_temas_takip_check
  CHECK (takip IN ('yeni', 'gorusuldu', 'eposta_gonderildi', 'teknik_bilgi_istendi',
                   'cizim_bekleniyor', 'teklif_verilecek', 'teklif_gonderildi', 'olumsuz'));

-- Hangi kanal satış getiriyor sorusu buradan cevaplanır.
ALTER TABLE crm_temas ADD COLUMN kanal TEXT NOT NULL DEFAULT 'diger'
  CHECK (kanal IN ('fuar', 'tanitim_maili', 'site_formu', 'europages', 'telefon', 'ziyaret',
                   'referans', 'eski_musteri', 'diger'));
UPDATE crm_temas SET kanal = 'fuar' WHERE etkinlik_id IS NOT NULL;

-- Panelden aktarılan kaydın kimliği ("talep:37", "hedef:743001"); aynı kayıt iki kez gelmez.
ALTER TABLE crm_temas ADD COLUMN kaynak TEXT UNIQUE;

-- Yüklenen dosyalar (teklif PDF'i, müşteri çizimi). Veritabanında durur: yedeğe
-- girer, sunucuda ayrı birim gerekmez. Boyut sınırı uygulamada (15 MB).
CREATE TABLE crm_dosya (
  id          SERIAL PRIMARY KEY,
  firma_id    INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  ad          TEXT NOT NULL,
  tur         TEXT NOT NULL,
  boyut       INTEGER NOT NULL,
  icerik      BYTEA NOT NULL,
  yukleyen    TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_dosya_firma ON crm_dosya (firma_id);

-- Teklif: satış teklifini kendi dosyasında hazırlar, CRM'de özeti ve PDF'i durur.
CREATE TABLE crm_teklif (
  id          SERIAL PRIMARY KEY,
  firma_id    INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  temas_id    INTEGER REFERENCES crm_temas(id) ON DELETE SET NULL,
  teklif_no   TEXT,
  konu        TEXT,
  tarih       DATE NOT NULL,
  gecerlilik  DATE,
  tutar       NUMERIC(14, 2),
  doviz       TEXT NOT NULL DEFAULT 'EUR' CHECK (doviz IN ('EUR', 'USD', 'TRY', 'GBP')),
  durum       TEXT NOT NULL DEFAULT 'gonderildi'
              CHECK (durum IN ('hazirlaniyor', 'gonderildi', 'kabul', 'red', 'iptal')),
  red_sebebi  TEXT CHECK (red_sebebi IS NULL OR red_sebebi IN
              ('fiyat', 'teslim_suresi', 'rakip', 'proje_iptal', 'cevap_yok', 'teknik', 'finansman', 'diger')),
  dosya_id    INTEGER REFERENCES crm_dosya(id) ON DELETE SET NULL,
  notlar      TEXT,
  olusturan   TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_teklif_firma ON crm_teklif (firma_id);
