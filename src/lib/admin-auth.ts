import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sorgu } from "@/lib/db";

/**
 * Yönetim paneli girişi — kullanıcılar VERİTABANINDA, imzalı çerezle oturum.
 *
 * **Neden env değil de veritabanı:** ilk sürümde kullanıcı adı ve parola
 * karması ortam değişkenindeydi. Sonuç: yeni kullanıcı açmak ya da parola
 * değiştirmek Dokploy panelinden env düzenleyip yeniden dağıtım yapmayı
 * gerektiriyordu. Veritabanı zaten bağlı ve çalışıyor; kullanıcıyı oraya
 * koymak işi tek SQL satırına indiriyor.
 *
 * Ortam değişkeni yolu GERİYE DÖNÜK olarak duruyor: `ADMIN_USER` +
 * `ADMIN_PASSWORD_HASH` tanımlıysa o da kabul edilir. Veritabanı erişilemez
 * olduğunda panele girebilmek için bir arka kapı değil — bilinçli bir yedek.
 *
 * Oturum imzası için gereken gizli anahtar `ayarlar` tablosunda tutulur ve
 * ilk ihtiyaçta kendiliğinden üretilir. `ADMIN_SESSION_SECRET` tanımlıysa o
 * tercih edilir.
 *
 * Karma biçimi `scrypt:<tuz>:<karma>` — ayıraç `:`, `$` DEĞİL. `@next/env`
 * dotenv-expand kullanıyor ve değerdeki `$abc` değişken sanılıp siliniyor;
 * `$` ayıraçlı karma env üzerinden gelince budanmış oluyor.
 */

const CEREZ = "sv_admin";
const SURE_SN = 60 * 60 * 12; // 12 saat

/* Gizli anahtar her istekte veritabanından okunmasın. */
let gizliOnbellek: string | null = null;

function scryptAsync(parola: string, tuz: Buffer): Promise<Buffer> {
  return new Promise((coz, red) =>
    scrypt(parola, tuz, 64, (e, k) => (e ? red(e) : coz(k)))
  );
}

export async function parolaKarmala(parola: string): Promise<string> {
  const tuz = randomBytes(16);
  const k = await scryptAsync(parola, tuz);
  return `scrypt:${tuz.toString("hex")}:${k.toString("hex")}`;
}

async function parolaDogru(parola: string, kayit: string): Promise<boolean> {
  const [tur, tuzHex, karmaHex] = kayit.split(":");
  if (tur !== "scrypt" || !tuzHex || !karmaHex) return false;
  const beklenen = Buffer.from(karmaHex, "hex");
  const gelen = await scryptAsync(parola, Buffer.from(tuzHex, "hex"));
  if (beklenen.length !== gelen.length) return false;
  return timingSafeEqual(beklenen, gelen);
}

/** Tabloları kurar. `semaKur` ile aynı mantık, kimlik tarafı için. */
export async function kimlikSemasiKur(): Promise<boolean> {
  const r = await sorgu(`
    CREATE TABLE IF NOT EXISTS yoneticiler (
      id          SERIAL PRIMARY KEY,
      kullanici   TEXT NOT NULL UNIQUE,
      karma       TEXT NOT NULL,
      olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS ayarlar (
      anahtar TEXT PRIMARY KEY,
      deger   TEXT NOT NULL
    );
  `);
  return r !== null;
}

/** Oturum imzası anahtarı: env > veritabanı > yeni üret. */
async function gizliAnahtar(): Promise<string | null> {
  const envden = process.env.ADMIN_SESSION_SECRET?.trim();
  if (envden && envden.length >= 24) return envden;
  if (gizliOnbellek) return gizliOnbellek;

  await kimlikSemasiKur();
  const v = await sorgu<{ deger: string }>(
    `SELECT deger FROM ayarlar WHERE anahtar = 'oturum_gizli'`
  );
  if (v === null) return null; // veritabanı yok
  if (v[0]?.deger) {
    gizliOnbellek = v[0].deger;
    return gizliOnbellek;
  }

  const yeni = randomBytes(48).toString("base64url");
  await sorgu(
    `INSERT INTO ayarlar (anahtar, deger) VALUES ('oturum_gizli', $1)
     ON CONFLICT (anahtar) DO NOTHING`,
    [yeni]
  );
  /* Yarış durumunda başkası yazmış olabilir — geri okuyup onu kullan. */
  const son = await sorgu<{ deger: string }>(
    `SELECT deger FROM ayarlar WHERE anahtar = 'oturum_gizli'`
  );
  gizliOnbellek = son?.[0]?.deger ?? yeni;
  return gizliOnbellek;
}

/** En az bir yönetici var mı (veritabanında ya da env'de)? */
export async function panelAcik(): Promise<boolean> {
  if (process.env.ADMIN_USER?.trim() && process.env.ADMIN_PASSWORD_HASH?.trim()) {
    return true;
  }
  await kimlikSemasiKur();
  const r = await sorgu<{ adet: string }>(
    `SELECT count(*)::text AS adet FROM yoneticiler`
  );
  return Number(r?.[0]?.adet ?? 0) > 0;
}

/** Kullanıcı ekler ya da parolasını değiştirir. Betikten çağrılır. */
export async function yoneticiKur(kullanici: string, parola: string) {
  await kimlikSemasiKur();
  const karma = await parolaKarmala(parola);
  await sorgu(
    `INSERT INTO yoneticiler (kullanici, karma) VALUES ($1, $2)
     ON CONFLICT (kullanici) DO UPDATE SET karma = EXCLUDED.karma`,
    [kullanici, karma]
  );
}

/** Panel kullanıcılarını listeler (karma DÖNMEZ). */
export async function yoneticiler() {
  await kimlikSemasiKur();
  return (
    (await sorgu<{ id: number; kullanici: string; olusturuldu: string }>(
      `SELECT id, kullanici, olusturuldu FROM yoneticiler ORDER BY id`
    )) ?? []
  );
}

/**
 * Kullanıcı siler. SON kullanıcıyı silmez — silseydi panele giriş yolu
 * kalmaz, açmak için sunucuya erişip betik çalıştırmak gerekirdi.
 */
export async function yoneticiSil(kullanici: string): Promise<string | null> {
  const liste = await yoneticiler();
  if (liste.length <= 1) return "Son kullanıcı silinemez — panele giriş yolu kalmaz.";
  await sorgu(`DELETE FROM yoneticiler WHERE kullanici = $1`, [kullanici]);
  return null;
}

function imzala(veri: string, gizli: string): string {
  return createHmac("sha256", gizli).update(veri).digest("hex");
}

/**
 * Doğruysa oturum çerezi kurar.
 *
 * Kullanıcı bulunamasa bile sahte bir karmayla scrypt çalıştırılıyor:
 * erken çıkmak, cevap süresinden "bu kullanıcı var mı" bilgisini sızdırır.
 */
const SAHTE_KARMA =
  "scrypt:" + "0".repeat(32) + ":" + "0".repeat(128);

export async function girisYap(kullanici: string, parola: string): Promise<boolean> {
  let karma: string | null = null;

  const envKullanici = process.env.ADMIN_USER?.trim();
  const envKarma = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (envKullanici && envKarma && envKullanici === kullanici) {
    karma = envKarma;
  } else {
    const r = await sorgu<{ karma: string }>(
      `SELECT karma FROM yoneticiler WHERE kullanici = $1`,
      [kullanici]
    );
    karma = r?.[0]?.karma ?? null;
  }

  const tamam = await parolaDogru(parola, karma ?? SAHTE_KARMA);
  if (!karma || !tamam) return false;

  const gizli = await gizliAnahtar();
  if (!gizli) return false;

  const bitis = Math.floor(Date.now() / 1000) + SURE_SN;
  const govde = `${kullanici}.${bitis}`;
  const cerez = await cookies();
  cerez.set(CEREZ, `${govde}.${imzala(govde, gizli)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SURE_SN,
  });
  return true;
}

export async function cikisYap() {
  (await cookies()).delete(CEREZ);
}

/** Geçerli oturumdaki kullanıcı adı, yoksa `null`. */
export async function oturum(): Promise<string | null> {
  const ham = (await cookies()).get(CEREZ)?.value;
  if (!ham) return null;

  const gizli = await gizliAnahtar();
  if (!gizli) return null;

  const son = ham.lastIndexOf(".");
  if (son < 0) return null;
  const govde = ham.slice(0, son);
  const imza = ham.slice(son + 1);

  const beklenen = imzala(govde, gizli);
  if (
    imza.length !== beklenen.length ||
    !timingSafeEqual(Buffer.from(imza), Buffer.from(beklenen))
  ) {
    return null;
  }

  const [kullanici, bitisStr] = govde.split(".");
  if (Number(bitisStr) < Math.floor(Date.now() / 1000)) return null;
  return kullanici || null;
}
