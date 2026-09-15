import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Yönetim paneli girişi — tek kullanıcı, parola karması, imzalı çerez.
 *
 * Harici kimlik kütüphanesi YOK. Tek bir kullanıcının panele girmesi için
 * NextAuth kurmak, bağımlılığı ve saldırı yüzeyini asıl işten büyük yapar.
 * Node'un kendi `crypto`su scrypt ve HMAC'i zaten veriyor.
 *
 * ÜÇ ORTAM DEĞİŞKENİ (hepsi `.env.local`'da, git'e ASLA girmez):
 *   ADMIN_USER            kullanıcı adı
 *   ADMIN_PASSWORD_HASH   `scrypt:<tuz>:<karma>` — üretmek için:
 *                         `node scripts/admin-parola.mjs "parolanız"`
 *   ADMIN_SESSION_SECRET  çerez imzası için rastgele uzun dize
 *
 * **Üçünden biri eksikse panel tamamen kapalıdır.** Varsayılan parola
 * KOYMUYORUM: yanlışlıkla canlıya çıkan bir varsayılan, kapının açık
 * bırakılmasından farksızdır.
 *
 * Parola düz metin olarak hiçbir yerde durmaz; sohbete de yazılmaz.
 */

const CEREZ = "sv_admin";
const SURE_SN = 60 * 60 * 12; // 12 saat

function ayar() {
  const kullanici = process.env.ADMIN_USER?.trim();
  const karma = process.env.ADMIN_PASSWORD_HASH?.trim();
  const gizli = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!kullanici || !karma || !gizli || gizli.length < 24) return null;
  return { kullanici, karma, gizli };
}

/** Panel yapılandırılmış mı? Değilse giriş sayfası bunu söyler. */
export function panelAcik(): boolean {
  return ayar() !== null;
}

function scryptAsync(parola: string, tuz: Buffer): Promise<Buffer> {
  return new Promise((coz, red) =>
    scrypt(parola, tuz, 64, (e, k) => (e ? red(e) : coz(k)))
  );
}

/**
 * `scrypt:<tuz hex>:<karma hex>` üretir. Betikten çağrılır.
 *
 * **AYIRAÇ `:` — `$` DEĞİL.** `@next/env` dotenv-expand kullanıyor: değerin
 * içindeki `$abc` bir değişken referansı sanılıp boş dizeyle değiştiriliyor.
 * `$` ayıraçlı karma `.env.local`'a yazıldığında uygulamaya budanmış geliyor
 * ve giriş sessizce "parola hatalı" diyor. 2026-09-15'te yaşandı; dosyadaki
 * değer doğruydu, uygulamanın gördüğü değer değildi.
 */
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
  /* Uzunluk farklıysa timingSafeEqual fırlatır; önce onu eşitliyoruz. */
  if (beklenen.length !== gelen.length) return false;
  return timingSafeEqual(beklenen, gelen);
}

function imzala(veri: string, gizli: string): string {
  return createHmac("sha256", gizli).update(veri).digest("hex");
}

/**
 * Kullanıcı adı + parola doğruysa oturum çerezi kurar.
 * Dönen `false`, kullanıcı adının mı parolanın mı yanlış olduğunu SÖYLEMEZ —
 * ikisini ayırmak, geçerli kullanıcı adını tahmin etmeyi kolaylaştırır.
 */
export async function girisYap(kullanici: string, parola: string): Promise<boolean> {
  const a = ayar();
  if (!a) return false;

  const kullaniciTamam =
    Buffer.byteLength(kullanici) === Buffer.byteLength(a.kullanici) &&
    timingSafeEqual(Buffer.from(kullanici), Buffer.from(a.kullanici));

  /* Kullanıcı adı yanlış olsa da parola karması hesaplanıyor: erken çıkmak,
     cevap süresinden kullanıcı adının doğruluğunu sızdırır. */
  const parolaTamam = await parolaDogru(parola, a.karma);
  if (!kullaniciTamam || !parolaTamam) return false;

  const bitis = Math.floor(Date.now() / 1000) + SURE_SN;
  const govde = `${a.kullanici}.${bitis}`;
  const cerez = await cookies();
  cerez.set(CEREZ, `${govde}.${imzala(govde, a.gizli)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SURE_SN,
  });
  return true;
}

export async function cikisYap() {
  const cerez = await cookies();
  cerez.delete(CEREZ);
}

/** Geçerli oturumdaki kullanıcı adı, yoksa `null`. */
export async function oturum(): Promise<string | null> {
  const a = ayar();
  if (!a) return null;
  const ham = (await cookies()).get(CEREZ)?.value;
  if (!ham) return null;

  const son = ham.lastIndexOf(".");
  if (son < 0) return null;
  const govde = ham.slice(0, son);
  const imza = ham.slice(son + 1);

  const beklenen = imzala(govde, a.gizli);
  if (
    imza.length !== beklenen.length ||
    !timingSafeEqual(Buffer.from(imza), Buffer.from(beklenen))
  ) {
    return null;
  }

  const [kullanici, bitisStr] = govde.split(".");
  if (Number(bitisStr) < Math.floor(Date.now() / 1000)) return null;
  return kullanici === a.kullanici ? kullanici : null;
}
