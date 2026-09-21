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
 *   gonderim_durumu  — tek satır: son deneme zamanı (aralık kuralı) ve sigorta
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

  CREATE TABLE IF NOT EXISTS gonderim_durumu (
    id           INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    son_deneme   TIMESTAMPTZ,
    durdu_bitis  TIMESTAMPTZ,
    durdu_sebep  TEXT NOT NULL DEFAULT ''
  );
  INSERT INTO gonderim_durumu (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
`;
