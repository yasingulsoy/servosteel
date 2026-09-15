/**
 * Panel kullanıcısı açar ya da parolasını değiştirir.
 *
 *   node scripts/yonetici-ekle.mjs yasin "parola"
 *   node scripts/yonetici-ekle.mjs --liste
 *
 * Kullanıcılar veritabanındaki `yoneticiler` tablosunda durur — yeni kullanıcı
 * açmak için yeniden dağıtım GEREKMEZ. Parola düz metin olarak hiçbir yere
 * yazılmaz; yalnızca `scrypt:<tuz>:<karma>` saklanır.
 *
 * Bağlantıyı `.env.local`'daki DATABASE_URL'den okur.
 */
import { randomBytes, scrypt } from "node:crypto";
import fs from "node:fs";
import pg from "pg";

function ortam() {
  let ham;
  try {
    ham = fs.readFileSync(".env.local", "utf8");
  } catch {
    console.error(".env.local bulunamadı. Proje kökünden çalıştırın.");
    process.exit(1);
  }
  return Object.fromEntries(
    ham
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
      })
  );
}

const env = ortam();
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL tanımlı değil.");
  process.exit(1);
}

const istemci = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL === "off" ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

await istemci.connect();
await istemci.query(`
  CREATE TABLE IF NOT EXISTS yoneticiler (
    id SERIAL PRIMARY KEY,
    kullanici TEXT NOT NULL UNIQUE,
    karma TEXT NOT NULL,
    olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS ayarlar (
    anahtar TEXT PRIMARY KEY, deger TEXT NOT NULL);
`);

if (process.argv[2] === "--liste") {
  const r = await istemci.query(
    "SELECT kullanici, olusturuldu FROM yoneticiler ORDER BY id"
  );
  console.log(r.rowCount ? "Kullanıcılar:" : "Hiç kullanıcı yok.");
  for (const x of r.rows) {
    console.log("  ", x.kullanici, "·", new Date(x.olusturuldu).toLocaleString("tr-TR"));
  }
  await istemci.end();
  process.exit(0);
}

const kullanici = process.argv[2];
const parola = process.argv[3];

if (!kullanici || !parola) {
  console.error('Kullanım: node scripts/yonetici-ekle.mjs <kullanici> "<parola>"');
  console.error("          node scripts/yonetici-ekle.mjs --liste");
  await istemci.end();
  process.exit(1);
}
if (parola.length < 8) {
  console.error("Parola en az 8 karakter olmalı.");
  await istemci.end();
  process.exit(1);
}

const tuz = randomBytes(16);
const karma = await new Promise((coz, red) =>
  scrypt(parola, tuz, 64, (e, k) => (e ? red(e) : coz(k)))
);

const r = await istemci.query(
  `INSERT INTO yoneticiler (kullanici, karma) VALUES ($1, $2)
   ON CONFLICT (kullanici) DO UPDATE SET karma = EXCLUDED.karma
   RETURNING (xmax = 0) AS yeni`,
  [kullanici, `scrypt:${tuz.toString("hex")}:${karma.toString("hex")}`]
);

console.log(
  r.rows[0].yeni
    ? `Kullanıcı açıldı: ${kullanici}`
    : `Parola güncellendi: ${kullanici}`
);
await istemci.end();
