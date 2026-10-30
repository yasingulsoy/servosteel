import { Pool, types, type PoolClient } from "pg";

/* DATE sütunları metin olarak gelsin ("2026-10-20"). pg varsayılanı Date
   nesnesi üretir, o da sunucunun saat dilimine göre bir gün kayabilir. */
types.setTypeParser(1082, (v: string) => v);

/**
 * PostgreSQL bağlantı havuzu — sitenin veritabanının aynısı, CRM tabloları
 * `crm_` önekli.
 *
 * Sitedekinin tersine burada hata YUTULMAZ: CRM satışın kaydı, yazılmayan
 * bir kayıt sessizce kaybolmamalı. Hata sayfası görünsün, kullanıcı bilsin.
 *
 * Havuz global'de: geliştirme modunda modüller sıcak yeniden yüklenir, her
 * yüklemede yeni havuz açmak bağlantı sınırını tüketir.
 */

declare global {
  var __crmHavuz: Pool | undefined;
}

function havuz(): Pool {
  if (!global.__crmHavuz) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error("DATABASE_URL tanımlı değil");
    global.__crmHavuz = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      ssl: process.env.DATABASE_SSL?.trim() === "off" ? undefined : { rejectUnauthorized: false },
    });
    global.__crmHavuz.on("error", (e) => console.error("[crm db] havuz hatası:", e.message));
  }
  return global.__crmHavuz;
}

export async function sorgu<T = Record<string, unknown>>(metin: string, degerler: unknown[] = []): Promise<T[]> {
  const r = await havuz().query(metin, degerler);
  return r.rows as T[];
}

export async function tek<T = Record<string, unknown>>(metin: string, degerler: unknown[] = []): Promise<T | null> {
  return (await sorgu<T>(metin, degerler))[0] ?? null;
}

/** Birden çok yazma tek işlemde: biri patlarsa hepsi geri alınır. */
export async function islem<T>(is: (b: PoolClient) => Promise<T>): Promise<T> {
  const b = await havuz().connect();
  try {
    await b.query("BEGIN");
    const sonuc = await is(b);
    await b.query("COMMIT");
    return sonuc;
  } catch (e) {
    await b.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    b.release();
  }
}
