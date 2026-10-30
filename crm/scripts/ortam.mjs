/**
 * Betikler için veritabanı bağlantısı. DATABASE_URL önce ortamdan, yoksa
 * crm/.env.local'dan okunur (Next'in kendisi gibi). Canlıda Dokploy ortamı verir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function dosyadanOku(ad) {
  const dosya = path.join(kok, ".env.local");
  if (!fs.existsSync(dosya)) return undefined;
  const satir = fs
    .readFileSync(dosya, "utf8")
    .split(/\r?\n/)
    .find((s) => s.startsWith(`${ad}=`));
  return satir?.slice(ad.length + 1).trim().replace(/^["']|["']$/g, "");
}

export function ortam(ad) {
  return process.env[ad]?.trim() || dosyadanOku(ad);
}

export async function baglan() {
  const url = ortam("DATABASE_URL");
  if (!url) {
    console.error("DATABASE_URL yok: ortamda ya da crm/.env.local'da tanımlayın.");
    process.exit(1);
  }
  const istemci = new pg.Client({
    connectionString: url,
    ssl: ortam("DATABASE_SSL") === "off" ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await istemci.connect();
  return istemci;
}

export const CRM_KOK = kok;
