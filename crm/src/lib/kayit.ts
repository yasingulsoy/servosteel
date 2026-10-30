import { sorgu } from "./db";
import type { Kullanici } from "./oturum";

/** Denetim kaydı: kim, neyi, ne zaman. Hedef "firma #12" biçiminde. */
export async function kayitEkle(k: Kullanici, olay: string, hedef: string, ayrinti = ""): Promise<void> {
  await sorgu(`INSERT INTO crm_kayit (kullanici, olay, hedef, ayrinti) VALUES ($1, $2, $3, $4)`, [
    k.kullanici,
    olay,
    hedef,
    ayrinti.slice(0, 2000),
  ]);
}
