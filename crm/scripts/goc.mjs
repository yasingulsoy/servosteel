/**
 * Şema göçlerini (db/migrations/NNNN_ad.sql) sırayla uygular.
 *
 *   node scripts/goc.mjs          # bekleyenleri uygular
 *   node scripts/goc.mjs --kuru   # yalnız listeler
 *
 * Her dosya kendi işleminde (transaction) çalışır; hata olursa o dosya geri
 * alınır ve betik durur. Uygulananlar crm_goc tablosunda tutulur. Aynı anda
 * iki çalıştırma (ör. iki yayın) danışma kilidiyle sıraya girer.
 */
import fs from "node:fs";
import path from "node:path";
import { baglan, CRM_KOK } from "./ortam.mjs";

const KURU = process.argv.includes("--kuru");
const klasor = path.join(CRM_KOK, "db", "migrations");
const dosyalar = fs
  .readdirSync(klasor)
  .filter((d) => /^\d{4}_[\w-]+\.sql$/.test(d))
  .sort();

const db = await baglan();
try {
  await db.query("SELECT pg_advisory_lock(hashtext('crm_goc'))");
  await db.query(`CREATE TABLE IF NOT EXISTS crm_goc (
    dosya     TEXT PRIMARY KEY,
    uygulandi TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const { rows } = await db.query("SELECT dosya FROM crm_goc");
  const yapilan = new Set(rows.map((r) => r.dosya));
  const bekleyen = dosyalar.filter((d) => !yapilan.has(d));

  if (bekleyen.length === 0) {
    console.log(`Şema güncel (${dosyalar.length} göç uygulanmış).`);
  } else if (KURU) {
    console.log(`Bekleyen ${bekleyen.length} göç:\n  ${bekleyen.join("\n  ")}`);
  } else {
    for (const d of bekleyen) {
      const sql = fs.readFileSync(path.join(klasor, d), "utf8");
      await db.query("BEGIN");
      try {
        await db.query(sql);
        await db.query("INSERT INTO crm_goc (dosya) VALUES ($1)", [d]);
        await db.query("COMMIT");
        console.log(`Uygulandı: ${d}`);
      } catch (e) {
        await db.query("ROLLBACK");
        console.error(`HATA ${d}: ${e.message}\nBu dosya geri alındı; sonrakiler çalıştırılmadı.`);
        process.exitCode = 1;
        break;
      }
    }
  }
} finally {
  await db.query("SELECT pg_advisory_unlock(hashtext('crm_goc'))").catch(() => {});
  await db.end();
}
