-- Görevler (hatırlatma), firma sorumlusu, satış sonrası: sipariş, kurulu makine, servis.

-- Her firmanın bir sorumlusu (kullanıcı adı). Boşsa sahipsiz.
ALTER TABLE crm_firma ADD COLUMN sorumlu TEXT;

-- Görev: kime, ne zamana kadar. Otomatik açılanlar "kaynak" taşır
-- ("teklif:12" = o teklifin takibi); aynı kaynaktan ikinci açık görev açılmaz.
CREATE TABLE crm_gorev (
  id          SERIAL PRIMARY KEY,
  baslik      TEXT NOT NULL,
  aciklama    TEXT,
  firma_id    INTEGER REFERENCES crm_firma(id) ON DELETE CASCADE,
  temas_id    INTEGER REFERENCES crm_temas(id) ON DELETE SET NULL,
  teklif_id   INTEGER REFERENCES crm_teklif(id) ON DELETE SET NULL,
  atanan      TEXT,
  son_tarih   DATE,
  durum       TEXT NOT NULL DEFAULT 'acik' CHECK (durum IN ('acik', 'tamam', 'iptal')),
  kaynak      TEXT,
  tamamlayan  TEXT,
  tamamlandi  TIMESTAMPTZ,
  olusturan   TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_gorev_acik ON crm_gorev (durum, son_tarih);
CREATE INDEX crm_gorev_firma ON crm_gorev (firma_id);
CREATE UNIQUE INDEX crm_gorev_kaynak_acik ON crm_gorev (kaynak) WHERE durum = 'acik' AND kaynak IS NOT NULL;

-- Sipariş: kabul edilen teklifin devamı (teklifsiz de açılabilir).
CREATE TABLE crm_siparis (
  id            SERIAL PRIMARY KEY,
  firma_id      INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  teklif_id     INTEGER REFERENCES crm_teklif(id) ON DELETE SET NULL,
  siparis_no    TEXT,
  konu          TEXT,
  tarih         DATE NOT NULL,
  tutar         NUMERIC(14, 2),
  doviz         TEXT NOT NULL DEFAULT 'EUR' CHECK (doviz IN ('EUR', 'USD', 'TRY', 'GBP')),
  teslim_tarihi DATE,
  durum         TEXT NOT NULL DEFAULT 'uretimde'
                CHECK (durum IN ('uretimde', 'sevk_edildi', 'kuruldu', 'tamamlandi', 'iptal')),
  notlar        TEXT,
  olusturan     TEXT,
  olusturuldu   TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_siparis_firma ON crm_siparis (firma_id);

-- Müşteride kurulu makine / hat: seri no, kurulum, garanti.
CREATE TABLE crm_makine (
  id             SERIAL PRIMARY KEY,
  firma_id       INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  siparis_id     INTEGER REFERENCES crm_siparis(id) ON DELETE SET NULL,
  ad             TEXT NOT NULL,
  seri_no        TEXT,
  kurulum_tarihi DATE,
  garanti_bitis  DATE,
  notlar         TEXT,
  olusturan      TEXT,
  olusturuldu    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_makine_firma ON crm_makine (firma_id);

-- Servis / yedek parça / eğitim talebi.
CREATE TABLE crm_servis (
  id          SERIAL PRIMARY KEY,
  firma_id    INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  makine_id   INTEGER REFERENCES crm_makine(id) ON DELETE SET NULL,
  tur         TEXT NOT NULL DEFAULT 'ariza'
              CHECK (tur IN ('ariza', 'bakim', 'yedek_parca', 'egitim', 'diger')),
  aciklama    TEXT NOT NULL,
  durum       TEXT NOT NULL DEFAULT 'acik' CHECK (durum IN ('acik', 'surecte', 'kapandi')),
  atanan      TEXT,
  acildi      DATE NOT NULL,
  kapandi     DATE,
  sonuc       TEXT,
  olusturan   TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_servis_firma ON crm_servis (firma_id);
CREATE INDEX crm_servis_durum ON crm_servis (durum);
