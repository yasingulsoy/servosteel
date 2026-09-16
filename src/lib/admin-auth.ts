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
    /* Rol: 'admin' kullanici acar, siler, baskasinin parolasini degistirir.
       'kullanici' yalnizca talepleri isler ve KENDI parolasini degistirir.
       Varsayilan 'kullanici' -- yeni hesap yetkisiz dogar, yetki bilincli verilir. */
    ALTER TABLE yoneticiler ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'kullanici';
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

/**
 * YENİ kullanıcı ekler; ad alınmışsa dokunmaz ve `false` döner.
 *
 * Eskiden var olanın parolasını sessizce değiştiriyordu. Ad yanlış
 * yazıldığında yeni hesap açılıyor, doğru yazıldığında başkasının parolası
 * uyarısız eziliyordu. Parola değiştirmek artık ayrı iş: `parolaAta`.
 */
export async function yoneticiEkle(kullanici: string, parola: string): Promise<boolean> {
  await kimlikSemasiKur();
  const r = await sorgu<{ id: number }>(
    `INSERT INTO yoneticiler (kullanici, karma) VALUES ($1, $2)
     ON CONFLICT (kullanici) DO NOTHING RETURNING id`,
    [kullanici, await parolaKarmala(parola)]
  );
  return (r?.length ?? 0) > 0;
}

/**
 * Var olan kullanıcıya yeni parola verir — mevcut parola SORULMADAN.
 * Bu yüzden yalnızca yönetici eyleminden çağrılır; kişinin kendi parolası
 * `parolaDegistir` ile değişir.
 */
export async function parolaAta(kullanici: string, parola: string): Promise<boolean> {
  const r = await sorgu<{ id: number }>(
    `UPDATE yoneticiler SET karma = $1 WHERE kullanici = $2 RETURNING id`,
    [await parolaKarmala(parola), kullanici]
  );
  return (r?.length ?? 0) > 0;
}

/**
 * Kullanıcının rolü. Env yoluyla giren kullanıcı (ADMIN_USER) admin sayılır —
 * o yol veritabanına erişilemediğinde panele girmek için var, kısıtlanması
 * anlamsız olurdu.
 */
export async function rolu(kullanici: string): Promise<"admin" | "kullanici" | null> {
  if (process.env.ADMIN_USER?.trim() && process.env.ADMIN_USER.trim() === kullanici) {
    return "admin";
  }
  await kimlikSemasiKur();
  const r = await sorgu<{ rol: string }>(
    `SELECT rol FROM yoneticiler WHERE kullanici = $1`, [kullanici]
  );
  const rol = r?.[0]?.rol;
  return rol === "admin" ? "admin" : rol ? "kullanici" : null;
}

/** Panel kullanıcılarını listeler (karma DÖNMEZ). */
export async function yoneticiler() {
  await kimlikSemasiKur();
  return (
    (await sorgu<{ id: number; kullanici: string; olusturuldu: string; rol: string }>(
      `SELECT id, kullanici, olusturuldu, rol FROM yoneticiler ORDER BY id`
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

/**
 * Kullanıcının KENDİ parolasını değiştirmesi.
 *
 * Mevcut parola SORULUYOR. Sormasaydık, çalınmış bir oturum çerezi olan
 * biri parolayı değiştirip asıl sahibi dışarıda bırakabilirdi; çerez 12
 * saat geçerli ve panel internete açık.
 *
 * Parola değişince eski çerezler geçersizleşir (bkz. `oturum`) — bu
 * cihazdaki oturum düşmesin diye çerez yeni parmak iziyle yeniden kuruluyor.
 * Bu yüzden yalnızca sunucu eyleminden çağrılabilir.
 */
export async function parolaDegistir(
  kullanici: string,
  mevcut: string,
  yeni: string
): Promise<string | null> {
  const r = await sorgu<{ karma: string }>(
    `SELECT karma FROM yoneticiler WHERE kullanici = $1`,
    [kullanici]
  );
  const karma = r?.[0]?.karma;
  if (!karma) return "Hesap bulunamadı. Ortam değişkeniyle giriş yaptıysanız parola oradan değişir.";
  if (!(await parolaDogru(mevcut, karma))) return "Mevcut parola hatalı.";
  if (yeni.length < 8) return "Yeni parola en az 8 karakter olmalı.";
  if (yeni === mevcut) return "Yeni parola eskisiyle aynı.";
  const yeniKarma = await parolaKarmala(yeni);
  await sorgu(`UPDATE yoneticiler SET karma = $1 WHERE kullanici = $2`, [yeniKarma, kullanici]);
  await cerezKur(kullanici, yeniKarma);
  return null;
}

function imzala(veri: string, gizli: string): string {
  return createHmac("sha256", gizli).update(veri).digest("hex");
}

function esit(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Kullanıcının kayıtlı parola karması; env kullanıcısıysa env'deki. */
async function kayitliKarma(kullanici: string): Promise<string | null> {
  const envKullanici = process.env.ADMIN_USER?.trim();
  const envKarma = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (envKullanici && envKarma && envKullanici === kullanici) return envKarma;
  const r = await sorgu<{ karma: string }>(
    `SELECT karma FROM yoneticiler WHERE kullanici = $1`,
    [kullanici]
  );
  return r?.[0]?.karma ?? null;
}

/**
 * Çereze konan parola parmak izi. Parola değişince ya da kullanıcı
 * silinince eski çerezin geçmemesi bunun sayesinde.
 *
 * Olmasaydı çerez yalnızca "kullanıcı adı + bitiş" taşırdı: yöneticinin
 * sildiği ya da parolasını değiştirdiği kişi, elindeki oturumla 12 saat
 * daha talepleri görmeye devam ederdi. Karmanın kendisi değil HMAC'i
 * konuyor — çerezden karma hakkında hiçbir şey okunamaz.
 */
function parmakIzi(karma: string, gizli: string): string {
  return imzala(`parola:${karma}`, gizli).slice(0, 16);
}

async function cerezKur(kullanici: string, karma: string): Promise<boolean> {
  const gizli = await gizliAnahtar();
  if (!gizli) return false;

  const bitis = Math.floor(Date.now() / 1000) + SURE_SN;
  const govde = `${kullanici}.${bitis}.${parmakIzi(karma, gizli)}`;
  (await cookies()).set(CEREZ, `${govde}.${imzala(govde, gizli)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SURE_SN,
  });
  return true;
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
  const karma = await kayitliKarma(kullanici);
  const tamam = await parolaDogru(parola, karma ?? SAHTE_KARMA);
  if (!karma || !tamam) return false;
  return cerezKur(kullanici, karma);
}

export async function cikisYap() {
  (await cookies()).delete(CEREZ);
}

/**
 * Geçerli oturumdaki kullanıcı adı, yoksa `null`.
 *
 * Çerez: `kullanici.bitis.parmakizi.imza`. SAĞDAN ayrıştırılıyor, çünkü
 * kullanıcı adında nokta olabilir. Önceki sürüm soldan bölüyordu:
 * "ali.veli" adlı kullanıcının oturumu "ali" olarak okunurdu.
 */
export async function oturum(): Promise<string | null> {
  const ham = (await cookies()).get(CEREZ)?.value;
  if (!ham) return null;

  const gizli = await gizliAnahtar();
  if (!gizli) return null;

  const parca = ham.split(".");
  if (parca.length < 4) return null;
  const imza = parca.pop()!;
  if (!esit(imza, imzala(parca.join("."), gizli))) return null;

  const parmak = parca.pop()!;
  const bitis = Number(parca.pop());
  const kullanici = parca.join(".");
  if (!kullanici || !Number.isFinite(bitis) || bitis < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const karma = await kayitliKarma(kullanici);
  if (!karma || !esit(parmak, parmakIzi(karma, gizli))) return null;
  return kullanici;
}
