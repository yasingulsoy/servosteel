/**
 * Tanıtım e-postası (outreach) tabloları.
 *
 * AYRI DOSYADA, çünkü iki yerden okunuyor: panel (`outreach-db.ts`) ve
 * listeyi veritabanına aktaran betik (`scripts/hedef-firma-aktar.mjs`). Betik
 * bu dosyayı Node'un tür ayıklamasıyla doğrudan içe aktarıyor — o yüzden
 * burada yalnızca düz metin var, `@/` yolu ve başka içe aktarma YOK.
 *
 *   hedef_firmalar   — araştırılmış firma, hazır e-postası ve durumu
 *   hedef_gonderim   — her gönderim DENEMESİ (başarısızlar dahil): kim, ne
 *                      zaman, hangi metin, sunucu ne cevap verdi
 *   hedef_not        — firma altındaki notlar
 *   eposta_engel     — bir daha yazılmayacak adresler (abonelikten çıkan,
 *                      "yazmayın" diyen). Gönderimden önce HER SEFERİNDE bakılır.
 *   gonderen_durumu  — kutu başına bir satır: son deneme zamanı (aralık
 *                      kuralı) ve sigorta. (Eski tek satırlık gonderim_durumu
 *                      kullanılmıyor; tek kutuyken yazılmıştı.)
 */
export const OUTREACH_SEMA = `
  CREATE TABLE IF NOT EXISTS hedef_firmalar (
    id              SERIAL PRIMARY KEY,
    anahtar         TEXT NOT NULL UNIQUE,
    firma           TEXT NOT NULL DEFAULT '',
    hitap           TEXT NOT NULL DEFAULT '',
    ulke            TEXT NOT NULL DEFAULT '',
    segmentler      TEXT NOT NULL DEFAULT '',
    web             TEXT NOT NULL DEFAULT '',
    kanit           TEXT NOT NULL DEFAULT '',
    urun            TEXT NOT NULL DEFAULT '',
    iletisim        TEXT NOT NULL DEFAULT '',
    eposta          TEXT NOT NULL DEFAULT '',
    dil             TEXT NOT NULL DEFAULT 'en',
    konu            TEXT NOT NULL DEFAULT '',
    govde           TEXT NOT NULL DEFAULT '',
    link            TEXT NOT NULL DEFAULT '',
    durum           TEXT NOT NULL DEFAULT 'bekliyor',
    /* Son aktarımda listede var mıydı. Firma sonradan "Elenenler"e
       taşınırsa satır SİLİNMEZ (gönderim geçmişi kaybolurdu), false olur
       ve gönderilemez. */
    listede         BOOLEAN NOT NULL DEFAULT true,
    iptal_anahtari  TEXT NOT NULL UNIQUE,
    gonderildi      TIMESTAMPTZ,
    olusturuldu     TIMESTAMPTZ NOT NULL DEFAULT now(),
    guncellendi     TIMESTAMPTZ NOT NULL DEFAULT now(),
    aktarildi       TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  /* Urun grubu ve panel sirasi (2026-09-22): 1 roll form, 2 dilme, 3 boy kesme,
     4 pres besleme, 5 kompakt hat, 6 diger. Sira Excel betiginde hesaplanir
     (grup → e-postali → sitede dogrulanan → elle arastirilan), panel yalniz uygular. */
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS kategori SMALLINT NOT NULL DEFAULT 6;
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS kategori_notu TEXT NOT NULL DEFAULT '';
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS sira INTEGER NOT NULL DEFAULT 0;
  /* true: yalniz otomatik kesiften (Google + otomatik dogrulama) gelen firma */
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS kesif BOOLEAN NOT NULL DEFAULT false;
  /* İkinci tur (hatırlatma) e-postası — ilk mektuba dönüş gelmeyen firmaya. */
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS konu2 TEXT NOT NULL DEFAULT '';
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS govde2 TEXT NOT NULL DEFAULT '';
  /* Takip hatirlatmasi (2026-09-26): "su gun tekrar yaz / ara". Istanbul
     gunu; bkz. lib/takip.ts. */
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS takip DATE;
  ALTER TABLE hedef_firmalar ADD COLUMN IF NOT EXISTS takip_notu TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS hedef_firmalar_takip_idx ON hedef_firmalar (takip) WHERE takip IS NOT NULL;
  CREATE INDEX IF NOT EXISTS hedef_firmalar_sira_idx ON hedef_firmalar (sira, id);
  CREATE INDEX IF NOT EXISTS hedef_firmalar_durum_idx ON hedef_firmalar (durum);
  CREATE INDEX IF NOT EXISTS hedef_firmalar_eposta_idx ON hedef_firmalar (lower(eposta));

  CREATE TABLE IF NOT EXISTS hedef_gonderim (
    id             SERIAL PRIMARY KEY,
    firma_id       INTEGER REFERENCES hedef_firmalar(id) ON DELETE SET NULL,
    zaman          TIMESTAMPTZ NOT NULL DEFAULT now(),
    kullanici      TEXT NOT NULL DEFAULT '',
    eposta         TEXT NOT NULL DEFAULT '',
    konu           TEXT NOT NULL DEFAULT '',
    govde          TEXT NOT NULL DEFAULT '',
    /* 'ok' | 'hata' | 'alici' (adres reddedildi) | 'belirsiz' (zaman aşımı:
       gitmiş olabilir) */
    sonuc          TEXT NOT NULL,
    yanit          TEXT NOT NULL DEFAULT '',
    mesaj_kimligi  TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS hedef_gonderim_zaman_idx ON hedef_gonderim (zaman DESC);
  CREATE INDEX IF NOT EXISTS hedef_gonderim_firma_idx ON hedef_gonderim (firma_id, zaman DESC);
  /* Aynı adrese ikinci tanıtım e-postası gitmesin — adres birden çok firma satırında olabilir */
  CREATE INDEX IF NOT EXISTS hedef_gonderim_eposta_idx ON hedef_gonderim (lower(eposta));
  /* Hangi kutudan gitti — kutu ve alan adı tavanı, ısınma buna göre sayılır */
  ALTER TABLE hedef_gonderim ADD COLUMN IF NOT EXISTS gonderen TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS hedef_gonderim_gonderen_idx ON hedef_gonderim (gonderen, zaman DESC);
  /* Giden HTML hâli (düz metin govde'de) — "Giden" sayfası e-postayı alıcının gördüğü gibi gösterir */
  ALTER TABLE hedef_gonderim ADD COLUMN IF NOT EXISTS govde_html TEXT NOT NULL DEFAULT '';
  /* Kaçıncı tur: 1 ilk tanıtım, 2 hatırlatma. */
  ALTER TABLE hedef_gonderim ADD COLUMN IF NOT EXISTS tur SMALLINT NOT NULL DEFAULT 1;

  CREATE TABLE IF NOT EXISTS hedef_not (
    id           SERIAL PRIMARY KEY,
    firma_id     INTEGER NOT NULL REFERENCES hedef_firmalar(id) ON DELETE CASCADE,
    olusturuldu  TIMESTAMPTZ NOT NULL DEFAULT now(),
    yazan        TEXT NOT NULL DEFAULT '',
    govde        TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS hedef_not_firma_idx ON hedef_not (firma_id, olusturuldu DESC);

  CREATE TABLE IF NOT EXISTS eposta_engel (
    eposta  TEXT PRIMARY KEY,
    sebep   TEXT NOT NULL DEFAULT '',
    zaman   TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS gonderen_durumu (
    gonderen     TEXT PRIMARY KEY,
    son_deneme   TIMESTAMPTZ,
    durdu_bitis  TIMESTAMPTZ,
    durdu_sebep  TEXT NOT NULL DEFAULT ''
  );

  /* Gönderen kutularına GELEN ve işlenen iletiler — yanıt, geri dönüş, abonelik
     iptali, otomatik yanıt (bkz. src/lib/gelen-tarama.ts). Anahtar IMAP'in UID'i:
     aynı ileti iki kez işlenmez. tur: yanit | geri_donus | gecici | otomatik |
     abonelik | ilgisiz (gönderdiğimiz bir firmayla eşleşmedi) */
  CREATE TABLE IF NOT EXISTS gelen_eposta (
    kutu           TEXT NOT NULL,
    uidvalidity    BIGINT NOT NULL,
    uid            BIGINT NOT NULL,
    mesaj_kimligi  TEXT NOT NULL DEFAULT '',
    kimden         TEXT NOT NULL DEFAULT '',
    konu           TEXT NOT NULL DEFAULT '',
    tur            TEXT NOT NULL,
    firma_id       INTEGER REFERENCES hedef_firmalar(id) ON DELETE SET NULL,
    ozet           TEXT NOT NULL DEFAULT '',
    zaman          TIMESTAMPTZ,
    islendi        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (kutu, uidvalidity, uid)
  );
  CREATE INDEX IF NOT EXISTS gelen_eposta_islendi_idx ON gelen_eposta (islendi DESC);
  /* Otomatik gönderim ayarı ve temposu — tek satır (bkz. src/lib/otomatik-gonderim.ts).
     Varsayılan KAPALI: panelden yönetici açar. */
  CREATE TABLE IF NOT EXISTS otomatik_gonderim (
    id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    acik          BOOLEAN NOT NULL DEFAULT false,
    gruplar       SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5}',
    ab_dahil      BOOLEAN NOT NULL DEFAULT false,
    kesif_dahil   BOOLEAN NOT NULL DEFAULT true,
    baslangic     SMALLINT NOT NULL DEFAULT 9,
    bitis         SMALLINT NOT NULL DEFAULT 18,
    hafta_sonu    BOOLEAN NOT NULL DEFAULT false,
    son_tik       TIMESTAMPTZ,
    son_gonderim  TIMESTAMPTZ,
    sonraki       TIMESTAMPTZ,
    son_sonuc     TEXT NOT NULL DEFAULT '',
    degistiren    TEXT NOT NULL DEFAULT '',
    degisti       TIMESTAMPTZ
  );
  INSERT INTO otomatik_gonderim (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

  /* Kutu başına tarama: nereye kadar okundu (UID), en son ne zaman, hata. */
  CREATE TABLE IF NOT EXISTS gelen_tarama (
    kutu         TEXT PRIMARY KEY,
    uidvalidity  BIGINT,
    son_uid      BIGINT NOT NULL DEFAULT 0,
    basladi      TIMESTAMPTZ,
    bitti        TIMESTAMPTZ,
    son_hata     TEXT NOT NULL DEFAULT ''
  );
`;
