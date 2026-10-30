-- CRM temel şema: kullanıcılar, etkinlikler, firmalar, kişiler, ilgi alanları,
-- temaslar (etkinlikte / sonrasında görüşme), notlar, denetim kaydı.
-- Bütün tablolar crm_ önekli; panelin tablolarına dokunulmaz.

CREATE TABLE crm_kullanici (
  id           SERIAL PRIMARY KEY,
  kullanici    TEXT NOT NULL UNIQUE,
  ad           TEXT NOT NULL DEFAULT '',
  eposta       TEXT,
  -- yonetici: her şey + kullanıcılar · satis / pazarlama: kayıt girer, düzenler
  -- goruntuleyici: yalnız okur
  rol          TEXT NOT NULL DEFAULT 'satis'
               CHECK (rol IN ('yonetici', 'satis', 'pazarlama', 'goruntuleyici')),
  karma        TEXT NOT NULL,
  aktif        BOOLEAN NOT NULL DEFAULT true,
  -- art arda hatalı girişte geçici kilit
  basarisiz    SMALLINT NOT NULL DEFAULT 0,
  kilit_bitis  TIMESTAMPTZ,
  son_giris    TIMESTAMPTZ,
  olusturuldu  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Çerezde rastgele anahtar, burada yalnız SHA-256 karması durur: tablo
-- okunsa bile oturum çalınamaz.
CREATE TABLE crm_oturum (
  anahtar_karma TEXT PRIMARY KEY,
  kullanici_id  INTEGER NOT NULL REFERENCES crm_kullanici(id) ON DELETE CASCADE,
  olusturuldu   TIMESTAMPTZ NOT NULL DEFAULT now(),
  son_gorulme   TIMESTAMPTZ NOT NULL DEFAULT now(),
  bitis         TIMESTAMPTZ NOT NULL,
  ip            TEXT,
  tarayici      TEXT
);
CREATE INDEX crm_oturum_kullanici ON crm_oturum (kullanici_id);

CREATE TABLE crm_etkinlik (
  id          SERIAL PRIMARY KEY,
  ad          TEXT NOT NULL,
  tur         TEXT NOT NULL DEFAULT 'fuar'
              CHECK (tur IN ('fuar', 'ziyaret', 'konferans', 'webinar', 'diger')),
  baslangic   DATE,
  bitis       DATE,
  sehir       TEXT,
  ulke        TEXT,
  -- salon / stand / adres
  yer         TEXT,
  aciklama    TEXT,
  olusturan   TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crm_firma (
  id             SERIAL PRIMARY KEY,
  ad             TEXT NOT NULL,
  ulke           TEXT,
  bolge          TEXT,
  sehir          TEXT,
  web            TEXT,
  -- eşleştirme için: web adresinin alan adı, küçük harf, www'suz
  alan_adi       TEXT,
  sektor         TEXT,
  -- firmanın ne iş yaptığı, serbest metin
  faaliyet       TEXT,
  potansiyel     TEXT NOT NULL DEFAULT 'belirsiz'
                 CHECK (potansiyel IN ('yuksek', 'var', 'belirsiz', 'yok')),
  durum          TEXT NOT NULL DEFAULT 'aday'
                 CHECK (durum IN ('aday', 'musteri', 'eski_musteri', 'is_ortagi', 'rakip')),
  notlar         TEXT,
  -- panelin hedef_firmalar kaydına bağ (varsa); yabancı anahtar bilerek yok,
  -- panel tablosu kendi şemasını kendisi kuruyor
  hedef_firma_id INTEGER,
  olusturan      TEXT,
  olusturuldu    TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_firma_alan_adi ON crm_firma (alan_adi);
CREATE INDEX crm_firma_ad ON crm_firma (lower(ad));

-- Kurum yetkilileri: bir firmada birden çok kişi.
CREATE TABLE crm_kisi (
  id          SERIAL PRIMARY KEY,
  firma_id    INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  ad          TEXT NOT NULL,
  unvan       TEXT,
  eposta      TEXT,
  eposta2     TEXT,
  telefon     TEXT,
  notlar      TEXT,
  olusturan   TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_kisi_firma ON crm_kisi (firma_id);
CREATE INDEX crm_kisi_eposta ON crm_kisi (lower(eposta));

-- Ürün / hizmet ilgi alanları. Kodlar mümkün olduğunca sitenin katalog
-- slug'larıyla aynı; liste ileride ayarlardan büyütülebilir.
CREATE TABLE crm_ilgi_alani (
  kod   TEXT PRIMARY KEY,
  ad    TEXT NOT NULL,
  grup  TEXT NOT NULL,
  sira  INTEGER NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE crm_firma_ilgi (
  firma_id INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  ilgi_kod TEXT NOT NULL REFERENCES crm_ilgi_alani(kod) ON UPDATE CASCADE,
  PRIMARY KEY (firma_id, ilgi_kod)
);

-- Temas: bir kişiyle (ya da kişisiz firmayla) görüşme. Etkinlikte
-- tanışılanlar etkinlik_id taşır; takip durumu ve son temas tarihi burada.
CREATE TABLE crm_temas (
  id          SERIAL PRIMARY KEY,
  firma_id    INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  kisi_id     INTEGER REFERENCES crm_kisi(id) ON DELETE SET NULL,
  etkinlik_id INTEGER REFERENCES crm_etkinlik(id) ON DELETE SET NULL,
  -- görüşme günü (etkinlikte tam gün bilinmiyorsa boş)
  tarih       DATE,
  -- müşterinin istediği / sorduğu
  talep       TEXT,
  takip       TEXT NOT NULL DEFAULT 'gorusuldu'
              CHECK (takip IN ('gorusuldu', 'eposta_gonderildi', 'teknik_bilgi_istendi',
                               'cizim_bekleniyor', 'teklif_verilecek', 'teklif_gonderildi',
                               'olumsuz')),
  son_temas   DATE,
  notlar      TEXT,
  olusturan   TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncellendi TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_temas_firma ON crm_temas (firma_id);
CREATE INDEX crm_temas_etkinlik ON crm_temas (etkinlik_id);

-- Firma zaman çizelgesindeki serbest notlar.
CREATE TABLE crm_not (
  id          SERIAL PRIMARY KEY,
  firma_id    INTEGER NOT NULL REFERENCES crm_firma(id) ON DELETE CASCADE,
  metin       TEXT NOT NULL,
  yazan       TEXT,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_not_firma ON crm_not (firma_id);

-- Denetim kaydı: kim, neyi, ne zaman.
CREATE TABLE crm_kayit (
  id        BIGSERIAL PRIMARY KEY,
  kullanici TEXT,
  olay      TEXT NOT NULL,
  hedef     TEXT,
  ayrinti   TEXT,
  zaman     TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO crm_ilgi_alani (kod, ad, grup, sira) VALUES
  ('ozel-profil',                  'Özel profil roll form hattı',        'Roll form hatları', 10),
  ('c-sigma-omega',                'C / Z / Sigma / Omega aşık hattı',   'Roll form hatları', 20),
  ('trapez-cephe-paneli',          'Trapez ve cephe paneli hattı',       'Roll form hatları', 30),
  ('agir-raf',                     'Raf profili hattı',                  'Roll form hatları', 40),
  ('kablo-kanali',                 'Kablo kanalı / tava hattı',          'Roll form hatları', 50),
  ('solar-profil',                 'Solar profil hattı',                 'Roll form hatları', 60),
  ('yol-bariyeri',                 'Yol bariyeri hattı',                 'Roll form hatları', 70),
  ('gurultu-bariyeri',             'Gürültü bariyeri hattı',             'Roll form hatları', 80),
  ('iskele-kalas',                 'İskele kalası hattı',                'Roll form hatları', 90),
  ('dilme-hatti',                  'Rulo dilme hattı',                   'Rulo işleme hatları', 110),
  ('boy-kesme-hatti',              'Rulo boy kesme hattı',               'Rulo işleme hatları', 120),
  ('rulo-acicilar',                'Rulo açıcı',                         'Makineler', 210),
  ('servo-suruculer',              'Servo pres besleme',                 'Makineler', 220),
  ('dogrultmali-servo-suruculer',  'Doğrultmalı servo besleme',          'Makineler', 230),
  ('kompakt-hatlar',               'Kompakt hat',                        'Makineler', 240),
  ('servo-punch-pres',             'Servo punch pres',                   'Makineler', 250),
  ('otomatik-istifleyici',         'Otomatik istifleyici',               'Makineler', 260),
  ('kalip-merdane',                'Kalıp / merdane',                    'Hizmet ve parça', 310),
  ('yedek-parca-servis',           'Yedek parça / servis',               'Hizmet ve parça', 320),
  ('diger',                        'Diğer',                              'Hizmet ve parça', 900);
