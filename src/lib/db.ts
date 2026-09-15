import { Pool } from "pg";

/**
 * PostgreSQL bağlantı havuzu.
 *
 * **ZORUNLU DEĞİL.** `DATABASE_URL` tanımlı değilse `null` döner ve arayan
 * taraf sessizce devam eder. Sebebi tek cümleyle: **veritabanı talebi
 * kaybetmemeli.** Talep akışının aslı e-postadır (`sendLead`), veritabanı
 * onun üstüne konan bir kayıt katmanı. Postgres düşerse, dolarsa, şifresi
 * değişirse form çalışmaya devam eder — tersi olsaydı bir gün sessizce iş
 * kaybederdik.
 *
 * Havuz global'de saklanıyor: Next geliştirme modunda modülleri sıcak
 * yeniden yüklüyor ve her yüklemede yeni havuz açmak bağlantı sınırını
 * birkaç dakikada tüketiyor.
 */

declare global {
  // eslint-disable-next-line no-var
  var __servosteelPool: Pool | null | undefined;
}

function olustur(): Pool | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  return new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    /* Barındırılan Postgres (Supabase, Neon) TLS ister ama sertifikayı
       kendi CA'sıyla imzalar. `DATABASE_SSL=off` ile kapatılabilir —
       aynı sunucudaki yerel Postgres için gerekir. */
    ssl:
      process.env.DATABASE_SSL?.trim() === "off"
        ? undefined
        : { rejectUnauthorized: false },
  });
}

export function db(): Pool | null {
  if (global.__servosteelPool === undefined) {
    global.__servosteelPool = olustur();
    global.__servosteelPool?.on("error", (e) => {
      /* Boştaki bağlantı koptuğunda pg 'error' fırlatır; yakalanmazsa
         Node süreci düşer. Havuz kendi yenisini açar, loglayıp geçiyoruz. */
      console.error("[db] havuz hatası:", e.message);
    });
  }
  return global.__servosteelPool;
}

/** Bağlantı yoksa `null`, varsa sorgu sonucu. Hata fırlatmaz — loglar. */
export async function sorgu<T = Record<string, unknown>>(
  metin: string,
  degerler: unknown[] = []
): Promise<T[] | null> {
  const havuz = db();
  if (!havuz) return null;
  try {
    const r = await havuz.query(metin, degerler);
    return r.rows as T[];
  } catch (e) {
    console.error("[db] sorgu hatası:", (e as Error).message);
    return null;
  }
}

/** `sorgu` gibi ama hatayı yukarı atar — yönetim panelinde sorunu görmek için. */
export async function sorguSert<T = Record<string, unknown>>(
  metin: string,
  degerler: unknown[] = []
): Promise<T[]> {
  const havuz = db();
  if (!havuz) throw new Error("DATABASE_URL tanımlı değil");
  const r = await havuz.query(metin, degerler);
  return r.rows as T[];
}
