import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sorgu, tek } from "./db";

/**
 * CRM girişi — kendi kullanıcı tablosu (crm_kullanici), veritabanında oturum.
 *
 * Çerezde 32 baytlık rastgele anahtar durur, veritabanında yalnız SHA-256
 * karması. Çıkışta ya da kullanıcı pasifleşince satır silinir ve çerez o an
 * geçersizleşir (imzalı çerezde bu mümkün değildi).
 *
 * Parola karması panelinkiyle aynı biçimde: `scrypt:<tuz>:<karma>`. Sitenin
 * panel hesapları da CRM'e girer (bkz. panelHesaplariniEsle).
 */

export type Rol = "yonetici" | "satis" | "pazarlama" | "goruntuleyici";
export type Kullanici = { id: number; kullanici: string; ad: string; rol: Rol };

const CEREZ = "crm_oturum";
const SURE_GUN = 7;
const KILIT_ESIK = 5;
const KILIT_DK = 15;

function scryptAsync(parola: string, tuz: Buffer): Promise<Buffer> {
  return new Promise((coz, red) => scrypt(parola, tuz, 64, (e, k) => (e ? red(e) : coz(k))));
}

export async function parolaKarmala(parola: string): Promise<string> {
  const tuz = randomBytes(16);
  return `scrypt:${tuz.toString("hex")}:${(await scryptAsync(parola, tuz)).toString("hex")}`;
}

async function parolaDogru(parola: string, kayit: string): Promise<boolean> {
  const [tur, tuzHex, karmaHex] = kayit.split(":");
  if (tur !== "scrypt" || !tuzHex || !karmaHex) return false;
  const beklenen = Buffer.from(karmaHex, "hex");
  const gelen = await scryptAsync(parola, Buffer.from(tuzHex, "hex"));
  return beklenen.length === gelen.length && timingSafeEqual(beklenen, gelen);
}

const karma = (anahtar: string) => createHash("sha256").update(anahtar).digest("hex");

/**
 * YALNIZ `next dev` ile ve CRM_GELISTIRME_GIRIS=1 iken: girişsiz geliştirici
 * oturumu. Canlıda (`next start`) NODE_ENV her zaman "production"dur, bu yol
 * orada hiçbir koşulda açılmaz. Veritabanında kullanıcı satırı yoktur.
 */
function gelistirici(): Kullanici | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (process.env.CRM_GELISTIRME_GIRIS?.trim() !== "1") return null;
  return { id: 0, kullanici: "gelistirici", ad: "Geliştirici (yerel)", rol: "yonetici" };
}

export async function oturum(): Promise<Kullanici | null> {
  const gel = gelistirici();
  if (gel) return gel;
  const anahtar = (await cookies()).get(CEREZ)?.value;
  if (!anahtar || anahtar.length < 40) return null;
  return tek<Kullanici>(
    `SELECT k.id, k.kullanici, k.ad, k.rol
       FROM crm_oturum o JOIN crm_kullanici k ON k.id = o.kullanici_id
      WHERE o.anahtar_karma = $1 AND o.bitis > now() AND k.aktif`,
    [karma(anahtar)]
  );
}

/** Sayfalar için: oturum yoksa girişe gönderir. */
export async function oturumZorunlu(): Promise<Kullanici> {
  const k = await oturum();
  if (!k) redirect("/giris");
  return k;
}

export const yazabilir = (k: Kullanici) => k.rol !== "goruntuleyici";

/** Eylemler için: oturum ve yazma yetkisi yoksa hata fırlatır. */
export async function yazarZorunlu(): Promise<Kullanici> {
  const k = await oturum();
  if (!k) redirect("/giris");
  if (!yazabilir(k)) throw new Error("Bu işlem için yetkiniz yok.");
  return k;
}

export async function yoneticiZorunlu(): Promise<Kullanici> {
  const k = await oturum();
  if (!k) redirect("/giris");
  if (k.rol !== "yonetici") throw new Error("Bu işlem yalnız yönetici içindir.");
  return k;
}

/**
 * Sitenin yönetim paneli hesapları (`yoneticiler`) CRM'e de girer.
 *
 * Panelde olup CRM'de olmayan hesap `panel_bagli` satır olarak açılır:
 * panelin 'admin'i CRM'de yönetici, diğerleri satış. Rolü sonradan CRM'in
 * Kullanıcılar sayfasından değiştirilebilir. Parola CRM'de tutulmaz, girişte
 * panelin güncel karmasıyla doğrulanır. Panelden silinen hesabın CRM satırı
 * pasifleşir ve açık oturumları kapanır.
 *
 * Aynı adla açılmış bir CRM hesabı varsa ona dokunulmaz; o ad CRM'in kendi
 * parolasıyla girer.
 */
export async function panelHesaplariniEsle(): Promise<void> {
  try {
    await sorgu(
      `INSERT INTO crm_kullanici (kullanici, ad, rol, karma, panel_bagli)
       SELECT lower(y.kullanici), y.kullanici, CASE WHEN y.rol = 'admin' THEN 'yonetici' ELSE 'satis' END, 'panel', true
         FROM yoneticiler y
        WHERE lower(y.kullanici) ~ '^[a-z0-9._-]{3,40}$'
       ON CONFLICT (kullanici) DO NOTHING`
    );
    const silinen = await sorgu<{ id: number }>(
      `UPDATE crm_kullanici k SET aktif = false
        WHERE k.panel_bagli AND k.aktif
          AND NOT EXISTS (SELECT 1 FROM yoneticiler y WHERE lower(y.kullanici) = k.kullanici)
        RETURNING k.id`
    );
    for (const s of silinen) await sorgu(`DELETE FROM crm_oturum WHERE kullanici_id = $1`, [s.id]);
  } catch (e) {
    /* Panel tablosu yoksa ya da okunamıyorsa CRM'in kendi hesapları yine çalışır. */
    console.error("[crm] panel hesapları eşlenemedi:", (e as Error).message);
  }
}

async function panelKarmasi(kullanici: string): Promise<string | null> {
  try {
    return (
      (await tek<{ karma: string }>(`SELECT karma FROM yoneticiler WHERE lower(kullanici) = $1`, [kullanici]))?.karma ?? null
    );
  } catch {
    return null;
  }
}

/** Başarılıysa null, değilse kullanıcıya gösterilecek hata. */
export async function girisYap(
  kullanici: string,
  parola: string,
  ip: string | null,
  tarayici: string | null
): Promise<string | null> {
  const HATA = "Kullanıcı adı ya da parola hatalı.";
  const bul = () =>
    tek<{ id: number; karma: string; aktif: boolean; kilitli: boolean; panel_bagli: boolean }>(
      `SELECT id, karma, aktif, panel_bagli, (kilit_bitis IS NOT NULL AND kilit_bitis > now()) AS kilitli
         FROM crm_kullanici WHERE kullanici = $1`,
      [kullanici]
    );
  let k = await bul();
  if (!k) {
    /* Panelde yeni açılmış bir hesap olabilir. */
    await panelHesaplariniEsle();
    k = await bul();
  }
  if (!k) {
    /* Kullanıcı yokken de aynı süreyi harca: ad tahmini zamanlamadan çıkmasın. */
    await parolaKarmala(parola);
    return HATA;
  }
  if (k.kilitli) return `Çok sayıda hatalı deneme. ${KILIT_DK} dakika sonra yeniden deneyin.`;
  const dogruKarma = k.panel_bagli ? await panelKarmasi(kullanici) : k.karma;
  if (!k.aktif || !dogruKarma || !(await parolaDogru(parola, dogruKarma))) {
    await sorgu(
      `UPDATE crm_kullanici
          SET basarisiz = basarisiz + 1,
              kilit_bitis = CASE WHEN basarisiz + 1 >= $2 THEN now() + make_interval(mins => $3) END
        WHERE id = $1`,
      [k.id, KILIT_ESIK, KILIT_DK]
    );
    return HATA;
  }

  const anahtar = randomBytes(32).toString("base64url");
  await sorgu(
    `INSERT INTO crm_oturum (anahtar_karma, kullanici_id, bitis, ip, tarayici)
     VALUES ($1, $2, now() + make_interval(days => $3), $4, $5)`,
    [karma(anahtar), k.id, SURE_GUN, ip, tarayici?.slice(0, 300) ?? null]
  );
  await sorgu(`UPDATE crm_kullanici SET basarisiz = 0, kilit_bitis = NULL, son_giris = now() WHERE id = $1`, [k.id]);
  /* Süresi geçmiş oturumları ara ara süpür. */
  await sorgu(`DELETE FROM crm_oturum WHERE bitis < now() - interval '1 day'`);

  (await cookies()).set(CEREZ, anahtar, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SURE_GUN * 24 * 60 * 60,
  });
  return null;
}

export async function cikisYap(): Promise<void> {
  const c = await cookies();
  const anahtar = c.get(CEREZ)?.value;
  if (anahtar) await sorgu(`DELETE FROM crm_oturum WHERE anahtar_karma = $1`, [karma(anahtar)]);
  c.delete(CEREZ);
}
