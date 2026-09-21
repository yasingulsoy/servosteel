import { headers } from "next/headers";
import { sorgu, sorguSert } from "@/lib/db";

/**
 * Panel kayıtları — kim ne zaman girdi, ne kadar kaldı, ne yaptı.
 *
 * İki tablo:
 *   panel_oturum  — her giriş bir satır: giriş, son etkinlik, çıkış, IP, cihaz
 *   panel_kayit   — tek tek işlemler: talep açtı, durum değiştirdi, not ekledi…
 *
 * OTURUMUN ANAHTARI ÇEREZDEKİ BİTİŞ ZAMANI. Çerez `kullanici.bitis.parmak.imza`
 * biçiminde ve her girişte yeni bir `bitis` üretiliyor; (kullanici, bitis)
 * ikilisi o girişi tek başına tanımlıyor. Çereze oturum kimliği eklemek
 * gerekmedi — eklenseydi çerez biçimi değişir, açık oturumların hepsi düşerdi.
 *
 * SÜRE = girişten son etkinliğe. Son etkinlik her panel isteğinde ve açık
 * sekmeden dakikada bir gelen nabızla güncelleniyor (bkz. `kabuk-istemci`);
 * nabız yalnızca sekme görünürken ve son 5 dakikada fare/klavye hareketi
 * varken atıyor. Yani panel açık bırakılıp başından kalkılan süre sayılmıyor.
 *
 * YAZMA HİÇ HATA FIRLATMAZ. Kayıt tutulamadı diye kimse panelden atılmamalı,
 * işlem yarım kalmamalı — `sorgu` hatayı loglayıp `null` döndürüyor.
 *
 * Saklama süresi 12 ay; eskiler her girişte siliniyor.
 */

export const OLAY_ETIKET = {
  giris: "Giriş yaptı",
  giris_hatali: "Hatalı giriş denemesi",
  cikis: "Çıkış yaptı",
  talep_goruntule: "Talebi açtı",
  durum: "Durumu değiştirdi",
  not: "Not ekledi",
  talep_ekle: "Talep ekledi",
  talep_sil: "Talebi sildi",
  kullanici_ekle: "Kullanıcı ekledi",
  kullanici_sil: "Kullanıcı sildi",
  parola_ver: "Başkasına parola verdi",
  parola_degistir: "Kendi parolasını değiştirdi",
  hedef_gonder: "Tanıtım e-postası gönderdi",
  hedef_gonder_hata: "Tanıtım e-postası gönderilemedi",
  hedef_durum: "Hedef firmanın durumunu değiştirdi",
  hedef_not: "Hedef firmaya not ekledi",
  hedef_engel: "Adresi engel listesine ekledi",
  sigorta_sifirla: "Gönderim sigortasını kaldırdı",
} as const;

export type KayitOlayi = keyof typeof OLAY_ETIKET;

const OTURUM_SN = 60 * 60 * 12; // admin-auth'taki çerez süresiyle aynı

/* CREATE TABLE her istekte çalışmasın — süreç başına bir kez yeter. */
let semaHazir = false;

async function kayitSemasiKur(): Promise<boolean> {
  if (semaHazir) return true;
  const r = await sorgu(`
    CREATE TABLE IF NOT EXISTS panel_oturum (
      id            SERIAL PRIMARY KEY,
      kullanici     TEXT NOT NULL,
      bitis         BIGINT NOT NULL,
      giris         TIMESTAMPTZ NOT NULL DEFAULT now(),
      son_etkinlik  TIMESTAMPTZ NOT NULL DEFAULT now(),
      cikis         TIMESTAMPTZ,
      ip            TEXT NOT NULL DEFAULT '',
      cihaz         TEXT NOT NULL DEFAULT '',
      UNIQUE (kullanici, bitis)
    );
    CREATE INDEX IF NOT EXISTS panel_oturum_giris_idx ON panel_oturum (giris DESC);

    CREATE TABLE IF NOT EXISTS panel_kayit (
      id         SERIAL PRIMARY KEY,
      zaman      TIMESTAMPTZ NOT NULL DEFAULT now(),
      kullanici  TEXT NOT NULL DEFAULT '',
      olay       TEXT NOT NULL,
      hedef      TEXT NOT NULL DEFAULT '',
      ayrinti    TEXT NOT NULL DEFAULT '',
      ip         TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS panel_kayit_zaman_idx ON panel_kayit (zaman DESC);
    CREATE INDEX IF NOT EXISTS panel_kayit_kullanici_idx ON panel_kayit (kullanici, zaman DESC);
  `);
  semaHazir = r !== null;
  return semaHazir;
}

/** İsteğin geldiği IP ve tarayıcı. Dokploy'un önündeki vekil IP'yi başlığa yazıyor. */
async function istemci(): Promise<{ ip: string; cihaz: string }> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "";
    return { ip: ip.slice(0, 64), cihaz: (h.get("user-agent") ?? "").slice(0, 300) };
  } catch {
    return { ip: "", cihaz: "" };
  }
}

/* ---------------------------------------------------------------- yazma */

export async function kayitEkle(kullanici: string, olay: KayitOlayi, hedef = "", ayrinti = "") {
  if (!(await kayitSemasiKur())) return;
  const { ip } = await istemci();
  await sorgu(
    `INSERT INTO panel_kayit (kullanici, olay, hedef, ayrinti, ip) VALUES ($1, $2, $3, $4, $5)`,
    [kullanici.slice(0, 80), olay, hedef.slice(0, 120), ayrinti.slice(0, 300), ip]
  );
}

/**
 * Talep açma kaydı. Aynı kişi aynı talebi 10 dakika içinde yeniden açarsa
 * (not ekleyip sayfa yenilendi, durum değişti…) ikinci satır yazılmaz —
 * yazılsaydı her not bir "açtı" satırı daha doğururdu.
 */
export async function talepAcildi(kullanici: string, talepId: number, ozet: string) {
  if (!(await kayitSemasiKur())) return;
  const { ip } = await istemci();
  await sorgu(
    `INSERT INTO panel_kayit (kullanici, olay, hedef, ayrinti, ip)
     SELECT $1::text, 'talep_goruntule', $2::text, $3::text, $4::text
     WHERE NOT EXISTS (
       SELECT 1 FROM panel_kayit
       WHERE kullanici = $1::text AND olay = 'talep_goruntule' AND hedef = $2::text
         AND zaman > now() - interval '10 minutes'
     )`,
    [kullanici.slice(0, 80), `talep:${talepId}`, ozet.slice(0, 300), ip]
  );
}

/** Başarılı girişte: oturum satırı + "giriş yaptı" + 12 aydan eski kayıtları temizle. */
export async function oturumBaslat(kullanici: string, bitis: number) {
  if (!(await kayitSemasiKur())) return;
  const { ip, cihaz } = await istemci();
  await sorgu(
    `INSERT INTO panel_oturum (kullanici, bitis, ip, cihaz) VALUES ($1, $2::bigint, $3, $4)
     ON CONFLICT (kullanici, bitis) DO NOTHING`,
    [kullanici, bitis, ip, cihaz]
  );
  await kayitEkle(kullanici, "giris");
  await sorgu(`
    DELETE FROM panel_kayit WHERE zaman < now() - interval '365 days';
    DELETE FROM panel_oturum WHERE giris < now() - interval '365 days';
  `);
}

/**
 * Geçerli oturumda her istekte çağrılır: son etkinliği günceller.
 *
 * Satır yoksa (bu kayıt sistemi gelmeden önce açılmış oturum) oluşturur;
 * giriş zamanı çerezin kurulduğu an, yani bitiş eksi 12 saat. Güncelleme en
 * fazla 30 saniyede bir yazılır — her istek bir UPDATE doğurmasın.
 */
export async function oturumDokun(kullanici: string, bitis: number) {
  if (!(await kayitSemasiKur())) return;
  const { ip, cihaz } = await istemci();
  await sorgu(
    `INSERT INTO panel_oturum (kullanici, bitis, giris, ip, cihaz)
     VALUES ($1, $2::bigint, to_timestamp($2::bigint - ${OTURUM_SN}), $3, $4)
     ON CONFLICT (kullanici, bitis) DO UPDATE SET son_etkinlik = now()
     WHERE panel_oturum.son_etkinlik < now() - interval '30 seconds'`,
    [kullanici, bitis, ip, cihaz]
  );
}

export async function oturumBitir(kullanici: string, bitis: number) {
  if (!(await kayitSemasiKur())) return;
  await sorgu(
    `UPDATE panel_oturum SET cikis = now(), son_etkinlik = now()
     WHERE kullanici = $1 AND bitis = $2::bigint`,
    [kullanici, bitis]
  );
  await kayitEkle(kullanici, "cikis");
}

/** Kendi parolasını değiştiren kişinin çerezi yenileniyor; oturum satırı yeni anahtara taşınır. */
export async function oturumAnahtariniTasi(kullanici: string, eski: number, yeni: number) {
  if (!(await kayitSemasiKur())) return;
  await sorgu(
    `UPDATE panel_oturum SET bitis = $3::bigint WHERE kullanici = $1 AND bitis = $2::bigint`,
    [kullanici, eski, yeni]
  );
}

/* ---------------------------------------------------------------- okuma */

export type OturumSatiri = {
  id: number;
  kullanici: string;
  giris: string;
  son_etkinlik: string;
  cikis: string | null;
  bitis: string;
  saniye: number;
  ip: string;
  cihaz: string;
};

export type KayitSatiri = {
  id: number;
  zaman: string;
  kullanici: string;
  olay: KayitOlayi;
  hedef: string;
  ayrinti: string;
  ip: string;
};

export type KullaniciOzeti = {
  kullanici: string;
  oturum: number;
  saniye: number;
  son_giris: string | null;
  islem: number;
  acilan: number;
  hatali: number;
};

/** Son oturumlar, yeniden eskiye. `kullanici` verilirse yalnızca onunkiler. */
export async function oturumlar(kullanici?: string, adet = 60): Promise<OturumSatiri[]> {
  await kayitSemasiKur();
  return sorguSert<OturumSatiri>(
    `SELECT id, kullanici, giris, son_etkinlik, cikis, bitis::text AS bitis, ip, cihaz,
            GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(cikis, son_etkinlik) - giris)))::int AS saniye
     FROM panel_oturum
     WHERE ($1::text IS NULL OR kullanici = $1)
     ORDER BY giris DESC
     LIMIT $2`,
    [kullanici ?? null, adet]
  );
}

export async function kayitlar(kullanici?: string, adet = 200): Promise<KayitSatiri[]> {
  await kayitSemasiKur();
  return sorguSert<KayitSatiri>(
    `SELECT id, zaman, kullanici, olay, hedef, ayrinti, ip
     FROM panel_kayit
     WHERE ($1::text IS NULL OR kullanici = $1)
     ORDER BY zaman DESC
     LIMIT $2`,
    [kullanici ?? null, adet]
  );
}

/**
 * Son `gun` günün kişi başı özeti. Hatalı giriş denemeleri kullanıcı
 * listesinde olmayan adlarla da gelebilir — onlar da ayrı satır olarak görünür.
 */
export async function kullaniciOzetleri(gun = 30): Promise<KullaniciOzeti[]> {
  await kayitSemasiKur();
  return sorguSert<KullaniciOzeti>(
    `WITH o AS (
       SELECT kullanici, count(*)::int AS oturum, max(giris) AS son_giris,
              COALESCE(sum(GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(cikis, son_etkinlik) - giris)))), 0)::int AS saniye
       FROM panel_oturum
       WHERE giris > now() - ($1::int * interval '1 day')
       GROUP BY kullanici
     ), k AS (
       SELECT kullanici,
              count(*) FILTER (WHERE olay NOT IN ('giris', 'cikis', 'giris_hatali', 'talep_goruntule'))::int AS islem,
              count(*) FILTER (WHERE olay = 'talep_goruntule')::int AS acilan,
              count(*) FILTER (WHERE olay = 'giris_hatali')::int AS hatali
       FROM panel_kayit
       WHERE zaman > now() - ($1::int * interval '1 day')
       GROUP BY kullanici
     )
     SELECT COALESCE(o.kullanici, k.kullanici) AS kullanici,
            COALESCE(o.oturum, 0) AS oturum, COALESCE(o.saniye, 0) AS saniye, o.son_giris,
            COALESCE(k.islem, 0) AS islem, COALESCE(k.acilan, 0) AS acilan, COALESCE(k.hatali, 0) AS hatali
     FROM o FULL OUTER JOIN k ON o.kullanici = k.kullanici
     ORDER BY o.son_giris DESC NULLS LAST, kullanici`,
    [gun]
  );
}
